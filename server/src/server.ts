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

  app.listen(config.port, () => {
    console.log(`\n🎉 EduMentor AI Backend Server is live at http://localhost:${config.port}`);
    console.log(`📡 Health Check URL: http://localhost:${config.port}/api/health\n`);
  });
};

startServer();
