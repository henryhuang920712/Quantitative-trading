import GoogleProvider from 'next-auth/providers/google'
// import FacebookProvider from "next-auth/providers/facebook";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import Pool from '@/lib/mssql_db';

export const options = {
    providers: [
        GoogleProvider({
            profile(profile) {
                let userRole = "google_user";
                return {
                    ...profile,
                    id: profile.sub,
                    role: userRole
                }
            },
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        GithubProvider({
            profile(profile) {
                let userRole = "github_user";
                return {
                    ...profile,
                    role: userRole
                }
            },
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                username: { label: "Username", type: "text", placeholder: "your-username" },
                password: { label: "Password", type: "password", placeholder: "your-password" }
            },
            async authorize(credentials) {
                try {

                    const foundUser = await Pool().then(async pool => {
                        const result = await pool.request()
                            .query(`SELECT * FROM Members WHERE username = '${credentials.username}' OR email = '${credentials.email}'`);
                        return result.recordset[0];
                    })
                    if (!foundUser) {
                        return { error: "User not found" };
                    }
                    const match = await bcrypt.compare(credentials.password, foundUser.password);
                    if (!match) {
                        return { error: "Wrong password" };
                    } else {
                        delete foundUser.password;
                        return foundUser;
                    }
                } catch (error) {
                    console.log(error);
                    return { error: "Error: " + error.message };
                }
            }
        })
    ],
    callbacks: {
        async signIn({user, account, profile}) {
            if (user?.error) {
                throw new Error(user.error);
            }
            if (account.provider === "credentials") {
                return true;
            }
            if (account.provider === "github") {
                return true;
            }
            if (account.provider === "google") {
                return true;
            }
            return false;
        },
        async redirect({url, baseUrl}) {
            return url;
        },
        async jwt({token, user}) {
            if (user) {
                token.role = user.role;
            }
            return token;
        },
        async session({session, token}) {
            if (session?.user) {
                session.user.role = token.user;
            }
            return session;
        }
    },
    pages: {
        signIn: "/",
    }
}