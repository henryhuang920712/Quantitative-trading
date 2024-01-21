
import {NextResponse} from 'next/server';
import bcrypt from 'bcrypt';
import User from '@/lib/user';
import mongoose from 'mongoose';


export async function POST(req) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, username, password, role } = body;

    // Check if the user already exists
    const duplicate = await User.findOne({
        $or: [
            { username: username },
            { email: email }
        ]
    }).lean().exec();
    if (duplicate) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    // Hash the password
    const hashPassword = await bcrypt.hash(password, 10);


    // Create a new user
    const user = new User({
      firstname: firstName,
      lastname: lastName,
      email: email,
      username: username,
      password: hashPassword,
      role: role,
      register_time: new Date(),
    });

    // Save the user to the database
    await user.save();

    // Return the user
    return NextResponse.json({ message: "Success: User registered successfully."}, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({message: `Error: ${error.message}`}, { status: 500 });
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
  }
}
