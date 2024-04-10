
import {NextResponse} from 'next/server';
import bcrypt from 'bcrypt';
import Pool from '@/lib/mssql_db';


export async function POST(req) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, username, password, role } = body;

    // Check if the user already exists
    const duplicate = await Pool().then(async pool => {
      const result = await pool.request()
        .query(`SELECT * FROM Members WHERE email = '${email}' OR username = '${username}'`);
      return result.recordset.length > 0;
    });

    if (duplicate) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    // Hash the password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = {
      firstname: firstName,
      lastname: lastName,
      email: email,
      username: username,
      password: hashPassword,
      role: role,
      register_time: new Date(),
    };

    // Save the user to the database
    const pool = await Pool();
    await pool.request()
      .input('firstname', user.firstname)
      .input('lastname', user.lastname)
      .input('email', user.email)
      .input('username', user.username)
      .input('password', user.password)
      .input('role', user.role)
      .input('register_time', user.register_time)
      .query(`INSERT INTO Members (firstname, lastname, email, username, password, role, register_time) VALUES (@firstname, @lastname, @email, @username, @password, @role, @register_time)`);
    
    // Return the user
    return NextResponse.json({ message: "Success: User registered successfully."}, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({message: `Error: ${error.message}`}, { status: 500 });
  } finally {
    // Close the connection
    await Pool().then(pool => pool.close());
  }
}
