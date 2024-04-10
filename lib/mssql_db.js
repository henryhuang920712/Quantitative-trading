import {ConnectionPool} from 'mssql'

export default async function Pool() {
    const pool = new ConnectionPool({
        server: "PRO13",
        user: "henryhuang920712",
        password: "mondrole20116@",
        database: "trading-project",
        connectionTimeout: 300000,
        options: {
            encrypt: false, // for azure
            trustServerCertificate: true
        }
    })
    
    await pool.connect();
    return pool;    
}



