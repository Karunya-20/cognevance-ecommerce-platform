require('dotenv').config();
const express=require('express');
const cors=require('cors');
const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const multer=require('multer');
const path=require('path');
const fs=require('fs');
const Stripe=require('stripe');

const app=express();
app.use(cors({origin:process.env.FRONTEND_URL||'http://localhost:5175'}));
app.use(express.json({limit:'100kb'}));
const uploadDir=path.join(__dirname,'uploads');
fs.mkdirSync(uploadDir,{recursive:true});
app.use('/uploads',express.static(uploadDir));
const storage=multer.diskStorage({destination:(_req,_file,cb)=>cb(null,uploadDir),filename:(_req,file,cb)=>cb(null,Date.now()+'-'+file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_'))});
const upload=multer({storage,limits:{fileSize:3*1024*1024},fileFilter:(_req,file,cb)=>cb(null,/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype))});

const User=mongoose.model('ShopUser',new mongoose.Schema({name:{type:String,required:true},email:{type:String,unique:true,required:true,lowercase:true},passwordHash:{type:String,required:true},role:{type:String,enum:['customer','admin'],default:'customer'}},{timestamps:true}));
const Product=mongoose.model('Product',new mongoose.Schema({name:{type:String,required:true,trim:true},description:{type:String,default:''},price:{type:Number,required:true,min:0},imageUrl:{type:String,default:''},category:{type:String,default:'General'},stock:{type:Number,default:0,min:0},active:{type:Boolean,default:true}},{timestamps:true}));
const Order=mongoose.model('Order',new mongoose.Schema({user:{type:mongoose.Schema.Types.ObjectId,ref:'ShopUser',required:true},items:[{product:{type:mongoose.Schema.Types.ObjectId,ref:'Product'},name:String,price:Number,quantity:Number}],total:{type:Number,required:true},status:{type:String,enum:['pending','paid','processing','shipped','cancelled'],default:'pending'},paymentSessionId:String},{timestamps:true}));
function auth(req,res,next){const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');try{if(!token)throw Error();req.user=jwt.verify(token,process.env.JWT_SECRET);next();}catch{return res.status(401).json({message:'Login required'});}}
function admin(req,res,next){if(req.user?.role!=='admin')return res.status(403).json({message:'Admin role required'});next();}
app.get('/api/health',(_req,res)=>res.json({success:true}));
app.post('/api/auth/register',async(req,res)=>{try{const{name,email,password}=req.body||{};if(!name?.trim()||!email?.trim()||!password||password.length<8)return res.status(400).json({message:'Name, email and password (8+ characters) required'});const em=email.toLowerCase().trim();if(await User.findOne({email:em}))return res.status(409).json({message:'Email already registered'});const u=await User.create({name,email:em,passwordHash:await bcrypt.hash(password,12)});const token=jwt.sign({id:u._id,role:u.role},process.env.JWT_SECRET,{expiresIn:'1d'});res.status(201).json({token,user:{id:u._id,name:u.name,email:u.email,role:u.role}});}catch(e){res.status(500).json({message:'Registration failed'});}});
app.post('/api/auth/login',async(req,res)=>{try{const u=await User.findOne({email:(req.body.email||'').toLowerCase().trim()});if(!u||!(await bcrypt.compare(req.body.password||'',u.passwordHash)))return res.status(401).json({message:'Invalid email or password'});const token=jwt.sign({id:u._id,role:u.role},process.env.JWT_SECRET,{expiresIn:'1d'});res.json({token,user:{id:u._id,name:u.name,email:u.email,role:u.role}});}catch(e){res.status(500).json({message:'Login failed'});}});
app.get('/api/products',async(_req,res)=>{try{res.json(await Product.find({active:true}).sort({createdAt:-1}));}catch(e){res.status(500).json({message:'Could not fetch products'});}});
app.post('/api/products',auth,admin,async(req,res)=>{try{const p=await Product.create(req.body);res.status(201).json(p);}catch(e){res.status(400).json({message:'Invalid product'});}});
app.patch('/api/products/:id',auth,admin,async(req,res)=>{try{const p=await Product.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});if(!p)return res.status(404).json({message:'Product not found'});res.json(p);}catch(e){res.status(400).json({message:'Invalid product update'});}});
app.delete('/api/products/:id',auth,admin,async(req,res)=>{try{const p=await Product.findByIdAndUpdate(req.params.id,{active:false},{new:true});if(!p)return res.status(404).json({message:'Product not found'});res.json({success:true});}catch(e){res.status(500).json({message:'Could not remove product'});}});
app.post('/api/products/:id/image',auth,admin,upload.single('image'),async(req,res)=>{if(!req.file)return res.status(400).json({message:'Upload a JPEG, PNG, WebP, or GIF image under 3MB'});const imageUrl=`/uploads/${req.file.filename}`;const p=await Product.findByIdAndUpdate(req.params.id,{imageUrl},{new:true});if(!p)return res.status(404).json({message:'Product not found'});res.json(p);});
app.post('/api/orders',auth,async(req,res)=>{try{const cart=req.body.items;if(!Array.isArray(cart)||!cart.length)return res.status(400).json({message:'Cart is empty'});const items=[];let total=0;for(const line of cart){const product=await Product.findOne({_id:line.productId,active:true});const quantity=Math.floor(Number(line.quantity));if(!product||!Number.isInteger(quantity)||quantity<1||quantity>product.stock)return res.status(400).json({message:'Invalid product or quantity'});items.push({product:product._id,name:product.name,price:product.price,quantity});total+=product.price*quantity;}const order=await Order.create({user:req.user.id,items,total});res.status(201).json(order);}catch(e){res.status(500).json({message:'Could not create order'});}});
app.get('/api/orders/mine',auth,async(req,res)=>res.json(await Order.find({user:req.user.id}).sort({createdAt:-1})));
app.post('/api/payments/checkout/:orderId',auth,async(req,res)=>{try{if(!process.env.STRIPE_SECRET_KEY||process.env.STRIPE_SECRET_KEY==='sk_test_replace_me')return res.status(501).json({message:'Configure STRIPE_SECRET_KEY with a Stripe test key first.'});const stripe=Stripe(process.env.STRIPE_SECRET_KEY);const order=await Order.findOne({_id:req.params.orderId,user:req.user.id});if(!order)return res.status(404).json({message:'Order not found'});const session=await stripe.checkout.sessions.create({mode:'payment',line_items:order.items.map(i=>({price_data:{currency:'inr',product_data:{name:i.name},unit_amount:Math.round(i.price*100)},quantity:i.quantity})),success_url:(process.env.PUBLIC_BASE_URL||'http://localhost:5175')+'/?payment=success',cancel_url:(process.env.PUBLIC_BASE_URL||'http://localhost:5175')+'/?payment=cancelled',metadata:{orderId:String(order._id)}});order.paymentSessionId=session.id;await order.save();res.json({url:session.url});}catch(e){res.status(500).json({message:'Checkout could not be created',detail:e.message});}});
app.get('/api/admin/analytics',auth,admin,async(_req,res)=>{const [products,orders,revenue,byStatus]=await Promise.all([Product.countDocuments({active:true}),Order.countDocuments(),Order.aggregate([{$match:{status:{$in:['paid','processing','shipped']}}},{$group:{_id:null,total:{$sum:'$total'}}}]),Order.aggregate([{$group:{_id:'$status',count:{$sum:1}}}])]);res.json({products,orders,revenue:revenue[0]?.total||0,byStatus});});
const port=process.env.PORT||5002;
mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/cognevance_shop').then(()=>app.listen(port,()=>console.log(`Shop API running on port ${port}`))).catch(e=>{console.error('MongoDB connection failed:',e.message);process.exit(1)});
