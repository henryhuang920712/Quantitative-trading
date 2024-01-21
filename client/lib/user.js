import mongoose, { Schema } from 'mongoose';

mongoose.connect(process.env.MONGODB_URI, {});
mongoose.Promise = global.Promise;

// Define User schema
const UserSchema = new Schema({
    firstname: String,
    lastname: String,
    email: String,
    username: String,
    password: String,
    role: String,
    register_time: Date,
});

// Create or retrieve User model
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;