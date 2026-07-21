const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'like',
      'comment',
      'follow',
      'mention',
      'new_post',
      'connection_request',
      'connection_accepted'
    ],
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

notificationSchema.index({
  recipient: 1,
  createdAt: -1
})

module.exports = mongoose.model(
  'Notification',
  notificationSchema
)
