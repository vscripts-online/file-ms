const mongoose = require('mongoose')

const FileHeaderSchema = new mongoose.Schema({
  key: String,
  value: String,
})

const FilePartSchema = new mongoose.Schema({
  owner: Number,
  name: String,
  offset: Number,
  size: Number,
  id: String
})

const FileSchema = new mongoose.Schema({
  name: String,
  original_name: String,
  mime_type: String,
  size: Number,
  slug: String,
  loading_from_cloud_now: { type: Boolean, default: false },
  headers: [FileHeaderSchema],
  parts: [{ type: FilePartSchema, default: [] }],
})


module.exports = mongoose.model('File', FileSchema)