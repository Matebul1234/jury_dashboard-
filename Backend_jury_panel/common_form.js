import express from 'express';
import db from "./server.js"
import cors from 'cors';


const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:5173',
    methods: 'GET,POST,PUT,DELETE',
    credentials: true,
}));


app.post('/commonform', (req, res) => {
    const sql = "INSERT INTO login (`first_name`, `last_name`, `email`, `mobile`, `password`) VALUES (?)";
    bcrypt.hash(req.body.password.toString(), saltRounds, (err, hash) => {
        if (err) {
            console.error("Error in hashing password:", err);
            return res.status(500).json({ message: 'Error in hashing password' });
        }

        const values = [
            req.body.first_name,
            req.body.last_name,
            req.body.email,
            req.body.mobile,
            hash
        ];

        db.query(sql, [values], (err, result) => {
            if (err) {
                console.error("Inserting data error in server:", err);
                return res.status(500).json({ error: "Error inserting data in the server" });
            }
            return res.status(200).json({ status: "Success", result });
        });
    });
});

export default app;