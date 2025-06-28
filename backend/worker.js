require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const rabbitMQService = require('./services/rabbitmq.service');

/**
 * Worker Service - DISABLED
 * Teacher routine functionality has been removed from the system
 * This worker now only handles basic queue connection for compatibility
 */

/**
 * Disabled worker - logs that teacher functionality has been removed
 */
async function processScheduleGenerationTask(msg, channel) {
  const messageId = Math.random().toString(36).substring(2, 10);
  
  try {
    console.log(`📨 [${messageId}] Received message but teacher functionality is disabled`);
    
    // Parse the message for logging
    let data;
    try {
      data = JSON.parse(msg.content.toString());
    } catch (parseError) {
      console.error(`❌ [${messageId}] Invalid JSON message format:`, parseError);
      channel.ack(msg);
      return;
    }

    console.log(`⚠️ [${messageId}] Teacher schedule generation has been disabled`);
    console.log(`   Affected teachers: ${data.affectedTeacherIds ? data.affectedTeacherIds.length : 0}`);
    
    // Acknowledge the message to remove it from queue
    channel.ack(msg);
    console.log(`✅ [${messageId}] Message acknowledged (functionality disabled)`);
    
  } catch (error) {
    console.error(`❌ [${messageId}] Error processing disabled task:`, error);
    channel.ack(msg); // Acknowledge to prevent infinite reprocessing
  }
}

/**
 * Placeholder function for backward compatibility
 */
async function recalculateTeacherSchedule(teacherId) {
  console.log(`⚠️ Teacher schedule recalculation disabled for teacher: ${teacherId}`);
  console.log('Teacher routine functionality has been removed from the system');
}

async function connectToQueue() {
  try {
    const rabbitMQUrl = process.env.RABBITMQ_URL || 'amqp://localhost';
    console.log('Worker connecting to RabbitMQ...');
    
    const connected = await rabbitMQService.connect({
      connectUrl: rabbitMQUrl,
      reconnectDelay: 5000,
      prefetch: 1
    });
    
    if (connected) {
      console.log('✅ Worker RabbitMQ connection established');
    } else {
      console.log('⚠️ RabbitMQ connection failed, continuing in offline mode');
    }
    
    return connected;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    return false;
  }
}

async function startWorker() {
  try {
    // Connect to database first
    await connectDB();
    console.log('✅ Worker database connection established');
    
    // Connect to RabbitMQ
    const connected = await connectToQueue();
    
    // Set up queue and consumer for 'teacher_routine_updates' (disabled)
    const queueName = 'teacher_routine_updates';
    
    if (connected) {
      // Register consumer for the queue (will just acknowledge and ignore messages)
      try {
        await rabbitMQService.consumeQueue(
          queueName, 
          processScheduleGenerationTask, 
          {
            queueOptions: { durable: true },
            consumerOptions: { noAck: false }
          }
        );
        
        console.log(`🚀 Worker started in DISABLED mode, listening for messages on queue: ${queueName}`);
        console.log('⚠️ Teacher routine functionality has been removed - messages will be acknowledged and ignored');
      } catch (queueError) {
        console.log('⚠️ Queue setup failed, running without queue consumer');
      }
    } else {
      console.log('🚀 Worker started in DISABLED mode without queue connection');
    }
    
    console.log('📋 Worker is running in disabled mode for teacher functionality');
    console.log('🛑 To exit press CTRL+C');
    
  } catch (error) {
    console.error('❌ Error starting worker:', error);
    console.log('⚠️ Worker will continue in minimal mode');
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('🛑 Worker shutting down gracefully...');
  try {
    await rabbitMQService.close();
    console.log('✅ Worker shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during worker shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled promise rejection:', err);
  // Don't exit the process, just log the error
  console.log('Worker continuing despite unhandled rejection...');
});

// Start the worker
if (require.main === module) {
  startWorker().catch(error => {
    console.error('❌ Failed to start worker:', error);
    console.log('Worker will run in minimal disabled mode');
  });
}

module.exports = {
  recalculateTeacherSchedule,
  processScheduleGenerationTask,
  startWorker
};