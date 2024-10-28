import express from 'express';
import dotenv from 'dotenv';
import userRouter from './routes/userRoutes.js'
import db from './config/db.js'

dotenv.config();

const app=express();
app.use(express.json());

app.use('/api/user', userRouter);

db.query('SELECT 1').then(()=>{
  console.log("Mysql Connected")

  const PORT=process.env.PORT || 5000
  app.listen(PORT,()=>{
    console.log(`Server is Listing on ${PORT}`)
})
}).catch((error)=>{
  console.log(error);
})
