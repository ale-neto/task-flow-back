require('dotenv').config();
const mongoose = require('mongoose');
const request = require('supertest');
const { app, server } = require('../server'); 
const User = require('../models/user'); 

let token;

beforeAll(async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_TEST_URI is not defined');
  }

  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB for testing');
    
    if (mongoose.connection && mongoose.connection.db) {
      console.log('MongoDB connection is valid');
    } else {
      throw new Error('MongoDB connection is invalid');
    }

    await mongoose.connection.db.dropDatabase();


    const testUser = new User({
      email: 'test@example.com',
      password: 'password', 
    });
    await testUser.save();

    const response = await request(app)
      .post('/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password'
      });

    console.log('Login response:', response.body); 
    token = response.body.token; 
    if (!token) {
      throw new Error('No token received from login');
    }
  } catch (error) {
    console.error('Failed to set up test environment', error);
    throw error; 
  }
});

afterAll(async () => {
  try {
    await mongoose.connection.close();
    
    server.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Failed to tear down test environment', error);
  }
});

test('Should create a new task successfully with valid token', async () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);

  const response = await request(app)
    .post('/v1/tasks')
    .set('x-auth-token', token) 
    .send({
      title: 'New Task',
      dueDate: futureDate,
    });

  console.log('Create task response:', response.body); 

  expect(response.status).toBe(201); 
  expect(response.body).toHaveProperty('_id'); 
  expect(response.body.title).toBe('New Task');
});
