import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';

const startServer = async () => {
  console.log('\n====================================================');
  console.log('🚀 Starting EduMentor AI Backend Server...');
  console.log(`🔗 Port: ${config.port}`);
  console.log(`🌐 Environment: ${config.nodeEnv}`);
  console.log('====================================================\n');

  await connectDB();

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`\n🎉 EduMentor AI Backend Server is live at http://127.0.0.1:${config.port}`);
    console.log(`📡 Health Check URL: http://127.0.0.1:${config.port}/api/health\n`);
  });
};

startServer();
