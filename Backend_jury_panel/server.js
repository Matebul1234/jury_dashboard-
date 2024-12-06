import express, { response } from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import https from 'https';

import fs from 'fs';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());


//app.use(cors({
    // origin: 'http://localhost:5173', 
  //  origin:'https://wafxselection.com',
    //methods: 'GET,POST,PUT,DELETE',
   // credentials: true,/
//}));
app.use((req, res, next) => {
    const allowedOrigins = ['https://wafxselection.com', 'https://www.wafxselection.com'];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
  }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
});
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/wafxselection.com/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/wafxselection.com/fullchain.pem')
  };

// db connected 
const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,  // Set a limit for the number of active connections
    queueLimit: 0,        // No limit for the connection queue
});

connection.getConnection((error, connection) => {
    if (error) {
        console.error("Error in connection:", error);
    } else {
        console.log("Database connected");
        connection.release(); // Release connection back to the pool
    }
});

const saltRounds = 10;
// verify user
const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ Error: "Your Next Move Starts Here: Onboard with Us!" });
    } else {
        jwt.verify(token, "secret_key_here", (err, decoded) => {
            if (err) {
                return res.json({ Error: "Token is not okey" });
            } else {
                req.name = decoded.name;
                req.last_name = decoded.last_name;
                next();
            }
        })
    }

}

//get Email for student_jury Check 
app.post('/jurycheck', (req, res) => {
    console.log(req.body, "jurry======")
    const sql = "select * from student_jury where email=?"
    connection.query(sql, [req.body.email], (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        if (data.length > 0) {
            return res.status(200).json({ data, message: "success" });
        } else {

            return res.status(404).json({ message: "Email does not exist" });
        }

    })
})
// checking professional jury data 
app.post('/jurycheckprofessional', (req, res) => {
    console.log(req.body, "here is the req.body");
    const sql = "select * from professional_jury where email=?"
    connection.query(sql, [req.body.email], (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        if (data.length > 0) {
            return res.status(200).json({ data, message: "success" });
        } else {

            return res.status(404).json({ message: "Email does not exist" });
        }

    })
});
// Professional candidate data based on zone  
app.post('/getdata_professional_based_on_zone', (req, res) => {
    // console.log(req.body, "body hfereees")
    const region = req.body.zone;
    const sql = "select * from professional_submission_candidate where region=?"
    connection.query(sql, [region], (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})
// candidate check candidate record available or not
app.post('/checkcandidate', (req, res) => {
    const sql = "select * from abai_registration where Email=?"
    connection.query(sql, [req.body.email], (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        if (data.length > 0) {
            return res.status(200).json({ data, message: "success" });
        } else {

            return res.status(404).json({ message: "Email does not exist" });
        }

    })
})

// Admin Auth 
app.post('/adminauth', (req, res) => {
    const sql = "select * from abai_admin where email=?"
    connection.query(sql, [req.body.email], (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        if (data.length > 0) {
            return res.status(200).json({ data, message: "success" });
        } else {

            return res.status(404).json({ message: "Email does not exist" });
        }

    })
})


// grand jury check they are available or not
app.post('/checkgrandjury', (req, res) => {
    const sql = "select * from grand_jury_records where email=?"
    connection.query(sql, [req.body.email], (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        if (data.length > 0) {
            return res.status(200).json({ data, message: "success" });
        } else {

            return res.status(404).json({ message: "Email does not exist" });
        }

    })
})

// get data fron registration table based on zone trial based data
// app.post('/getdata_based_on_zone', (req, res) => {
//     console.log(req.body, "body hfereees")
//     const Region = req.body.zone;
//     const sql = "select * from studend_registration where Region=?"
//     connection.query(sql, [Region], (err, data) => {
//         if (err) {
//             return res.status(500).json({ Error: "Database query error" });
//         }
//         return res.status(200).json(data)
//     })
// })
// Testing here 
app.post('/getdata_based_on_zone', (req, res) => {
    // console.log(req.body, "body hfereees")
    const Region = req.body.zone;
    const sql = "select * from student_submission_candidate where region=?"
    connection.query(sql, [Region], (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})
// get all preSelect candidate to check Grand jury
app.post('/getall_preSelect_candidate', (req, res) => {
    const zone = req.body.zone;
    const sql = "select * from preselected_candidate"
    connection.query(sql, [req.body.zone], (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})
// Grand jury giving the marks to the candidates
app.post('/update_grand_jury_data', (req, res) => {
    console.log("Request Body:", req.body);

    const {
        rowId,
        pracentage30,
        pracentage25,
        pracentage25second,
        pracentage20,
        totalmark
    } = req.body;

    const percentage30 = pracentage30 ?? 0;
    const percentage25 = pracentage25 ?? 0;
    const percentage25second = pracentage25second ?? 0;
    const percentage20 = pracentage20 ?? 0;
    const totalMark = totalmark ?? 0;

    const sql = "UPDATE preselected_candidate SET percentage30=?, percentage25=?, percentage25second=?, percentage20=?, totalmark=? WHERE id=?";

    connection.query(sql, [percentage30, percentage25, percentage25second, percentage20, totalMark, rowId], (err, data) => {
        if (err) {
            console.error("Database Query Error:", err);
            return res.status(500).json({ Error: "Database query error", Details: err.message });
        }
        return res.status(200).json({ message: "updated", data });
    });
});




// giving marks to profession_submission_candidates from preSelect jury
// app.post('/update_professional_jury_data', (req, res) => {
//     console.log(req.body, "here is all body elements");
//     const mark = req.body.mark1;
//     const name = req.body.juryData.full_name;
//     var j1_mark = mark + " " + name; 
//     const { email } = req.body.markId;
//     const juryData = req.body.juryData.typeofjury;
//     console.log(juryData, "herefsdfsdf");

//     if (juryData === 'j1') {
//         const sql = "UPDATE professional_submission_candidate SET j1_mark = ? WHERE email = ?";
//         connection.query(sql, [j1_mark, email], (err, updateddata) => {
//             if (err) {
//                 return res.status(500).json({ Error: "Database query error" });
//             }
//             return res.status(200).json({ updateddata, message: "updated" });
//         });
//     } else if (juryData === 'j2') {
//         const sql = "UPDATE professional_submission_candidate SET j2_mark = ? WHERE email = ?";
//         connection.query(sql, [j1_mark, email], (err, updateddata) => {
//             if (err) {
//                 return res.status(500).json({ Error: "Database query error" });
//             }
//             return res.status(200).json({ updateddata, message: "updated" });
//         });
//     } else if (juryData === 'j3') {
//         const sql = "UPDATE professional_submission_candidate SET j3_mark = ? WHERE email = ?";
//         connection.query(sql, [j1_mark, email], (err, updateddata) => {
//             if (err) {
//                 return res.status(500).json({ Error: "Database query error" });
//             }
//             return res.status(200).json({ updateddata, message: "updated" });
//         });
//     } else {
//         return res.status(400).json({ Error: "Invalid jury type" });
//     }
// });

app.post('/update_professional_jury_data', (req, res) => {
    console.log(req.body, "here is all body elements");

    const j1_mark = req.body.mark1;
    // const name = req.body.juryData.full_name;
    // const j1_mark = mark + " " + name;
    const { email } = req.body.markId;
    const juryData = req.body.juryData.typeofjury;
    var name = req.body.juryData.full_name;
    // Determine the SQL query based on the jury type
    let sql = "";
    if (juryData === 'j1') {
        sql = "UPDATE professional_submission_candidate SET jury_name_1=?, j1_mark = ? WHERE email = ?";
    } else if (juryData === 'j2') {
        sql = "UPDATE professional_submission_candidate SET jury_name_2=?,j2_mark = ? WHERE email = ?";
    } else if (juryData === 'j3') {
        sql = "UPDATE professional_submission_candidate SET jury_name_3=?,j3_mark = ? WHERE email = ?";
    } else {
        return res.status(400).json({ Error: "Invalid jury type" });
    }

    // Execute the UPDATE query
    connection.query(sql, [name,j1_mark, email], (err, updateddata) => {
        if (err) {
            console.error("Error updating data:", err);
            return res.status(500).json({ Error: "Database query error" });
        }

        // If the update is successful, fetch the updated row
        const selectSql = "SELECT * FROM professional_submission_candidate WHERE email = ?";
        connection.query(selectSql, [email], (err, result) => {
            if (err) {
                console.error("Error fetching updated row data:", err);
                return res.status(500).json({ Error: "Error fetching updated row data" });
            }

            return res.status(200).json({ updateddata: result, message: "updated" });
        });
    });
});


// STUDENT JURY DATA 
app.post('/update_jury_data', (req, res) => {
    console.log(req.body, "here is all body elements");
    const j1_mark = req.body.mark1;
    // const name = req.body.juryData.full_name;
    // const j1_mark = mark + " " + name; //+ "-" + name
    const { email } = req.body.markId;
    const juryData = req.body.juryData.jury_type;
    var name = req.body.juryData.full_name;

    let sql = "";
    if (juryData === 'j1') {
        sql = "UPDATE student_submission_candidate SET jury_nam_1=?, j1_mark = ? WHERE email = ?";
    } else if (juryData === 'j2') {
        sql = "UPDATE student_submission_candidate SET jury_nam_1=?,j2_mark = ? WHERE email = ?";
    } else if (juryData === 'j3') {
        sql = "UPDATE student_submission_candidate SET jury_nam_1=?,j3_mark = ? WHERE email = ?";
    } else {
        return res.status(400).json({ Error: "Invalid jury type" });
    }

    // Execute the UPDATE query
    connection.query(sql, [name,j1_mark, email], (err, updateddata) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        console.log(sql,"updated query")
        // If the update is successful, fetch the updated row
        const selectSql = "SELECT * FROM student_submission_candidate WHERE email = ?";
        connection.query(selectSql, [email], (err, result) => {
            if (err) {
                return res.status(500).json({ Error: "Error fetching updated row data" });
            }
            return res.status(200).json({ updateddata: result, message: "updated" });
        });
    });
});


// backup here 
app.post('/preselect_candidate', (req, res) => {
    console.log(req.body, "preselected data=======>>>>>>>");
    const { Name, Email, link, zone } = req.body.markId;
    const marks = req.body.marks;

    const checkEmailSql = "SELECT * FROM preselected_candidate WHERE Email = ?";
    connection.query(checkEmailSql, [Email], (err, result) => {
        if (err) {
            console.error("Error in checking email:", err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length > 0) {
            // If email exists, update the marks
            const updateSql = "UPDATE preselected_candidate SET `marks` = ? WHERE Email = ?";
            connection.query(updateSql, [marks, Email], (err, data) => {
                if (err) {
                    return res.status(500).json({ Error: "Database query error" });
                }
                return res.status(200).json({ data, message: "updated" });
            });
        } else {
            // If email does not exist, insert a new record
            const insertSql = "INSERT INTO preselected_candidate(`Name`, `Email`, `link`, `marks`, `zone`) VALUES (?, ?, ?, ?, ?)";
            connection.query(insertSql, [Name, Email, link, marks, zone], (err, data) => {
                if (err) {
                    return res.status(500).json({ Error: "Database query error" });
                }
                return res.status(200).json({ data, message: "success" });
            });
        }
    });
});


// ========
// app.post('/preselect_candidate', (req, res) => {
//     console.log(req.body, "preselected data=======>>>>>>>")
//     const { Name,Email,link, zone } = req.body.markId;
//     const marks = req.body.marks;
//     const checkEmailSql = "SELECT * FROM preselected_candidate WHERE Email = ?";
//     connection.query(checkEmailSql, [Email], (err, result) => {
//         if (err) {
//             console.error("Error in checking email:", err);
//             return res.status(500).json({ message: 'Server error' });
//         }

//         if (result.length > 0) {
//             // Email already exists
//             return res.status(409).json({ message: 'Email already exists' });
//         } else {

//         }
//     });

//     const sql = "insert into preselected_candidate(`Name`,`Email`, `link`,`marks`, `zone`) values (?,?,?,?,?)";
//     connection.query(sql, [Name,Email, link, marks, zone], (err, data) => {
//         if (err) {
//             return res.status(500).json({ Error: "Database query error" });
//         }
//         return res.status(200).json({ data, message: "success" });
//     });
// })




///candidate submission data
app.post('/submission_candidate', (req, res) => {
    // console.log(req.body, "candidate data");
    const { category, link1, link2, link3 } = req.body;
    const sql = "insert into submission_candidate(`category`, `link1`,`link2`,`link3`) values (?,?,?,?)";
    connection.query(sql, [category, link1, link2, link3], (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json({ data, message: "success" });
    });
})

// student submission data 
// app.post('/student_candidate', (req, res) => {

//     const { First_Name,Last_Name,Email, Category_Selection, Region, link1, link2, link3 } = req.body;
//     // var Name = First_Name + " " + Last_Name;
//     // Validate input data
//     if (!Email || !Category_Selection || !Region || !link1 || !link2 || !link3) {
//         return res.status(400).json({ message: 'Missing required fields' });
//     }

//     const checkEmailSql = "SELECT * FROM student_submission_candidate WHERE email = ?";
//     connection.query(checkEmailSql, [Email], (err, result) => {
//         if (err) {
//             console.error("Error in checking email:", err);
//             return res.status(500).json({ message: 'Server error' });
//         }

//         if (result.length > 0) {
//             // Email already exists in the database
//             return res.status(409).json({ message: 'Email already exists' });
//         } else {
//             // Insert new record
//             const sql = "INSERT INTO student_submission_candidate (`First_Name`,`Last_Name`,`email`, `category_selection`, `region`, `link1`, `link2`, `link3`) VALUES (?, ?, ?, ?, ?, ?,?,?)";
//             connection.query(sql, [First_Name,Last_Name,Email, Category_Selection, Region, link1, link2, link3], (err, data) => {
//                 if (err) return res.status(500).json({ error: "Database query error" });
//                 return res.status(200).json({ data, message: "success" });
//             })
//         }
//     });

// })
//

app.post('/student_candidate', (req, res) => {
    console.log(req.body, "student_submission_candidate data");

    const { First_Name, Last_Name, Email, Category_Selection, Region, link1, link2, link3 } = req.body;

    if (!Email || !Category_Selection || !Region || !link1 || !link2 || !link3) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Step 1: Check if the email already exists
    const checkEmailSql = "SELECT * FROM student_submission_candidate WHERE email = ?";
    connection.query(checkEmailSql, [Email], (err, result) => {
        if (err) {
            console.error("Error checking email:", err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length > 0) {
            // Email already exists in the database
            return res.status(409).json({ message: 'Email already exists' });
        }

        // Step 2: Insert the new record into the table
        const insertSql = `
            INSERT INTO student_submission_candidate 
            (First_Name, Last_Name, email, category_selection, region, link1, link2, link3) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        connection.query(insertSql, [First_Name, Last_Name, Email, Category_Selection, Region, link1, link2, link3], (err, data) => {
            if (err) {
                console.error("Database query error:", err);
                return res.status(500).json({ message: "Database query error" });
            }

            // Step 3: Get the last inserted ID
            const insertedId = data.insertId;
            console.log("Inserted Row ID:", insertedId);

            // Step 4: Generate unique ID
            const prefix = Category_Selection === 'Student' ? 'St' : 'Pr';  // Assuming 'Student' category generates 'St' prefix
            const generateUniqueId = `${prefix}${insertedId}`;
            console.log("Generated Unique ID:", generateUniqueId);

            // Step 5: Update the inserted record with the generated unique ID
            const updateSql = `
                UPDATE student_submission_candidate 
                SET generateUniqueId = ? 
                WHERE id = ?
            `;
            connection.query(updateSql, [generateUniqueId, insertedId], (err, updateResult) => {
                if (err) {
                    console.error("Error updating unique ID:", err);
                    return res.status(500).json({ message: "Error updating unique ID" });
                }

                // Step 6: Send the response
                return res.status(200).json({ message: "success", data: updateResult });
            });
        });
    });
});


app.post('/professional_candidate', (req, res) => {
    console.log(req.body, "professional_submission_candidate data");

    const { First_Name,Last_Name,Email, Category_Selection, Region, link1} = req.body;
    // var Name = First_Name + " " + Last_Name;
    // Validate input data
    if (!Email || !Category_Selection || !Region || !link1) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    const checkEmailSql = "SELECT * FROM professional_submission_candidate WHERE email = ?";
    connection.query(checkEmailSql, [Email], (err, result) => {
        if (err) {
            console.error("Error in checking email:", err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length > 0) {
            // Email already exists in the database
            return res.status(409).json({ message: 'Email already exists' });
        } else {
            // Insert new record
            const sql = `
                INSERT INTO professional_submission_candidate 
                (First_Name,Last_Name,email, category_selection, region, link1) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            connection.query(sql, [First_Name,Last_Name,Email, Category_Selection, Region, link1], (err, data) => {
                if (err) {
                    console.error("Database query error:", err);
                    return res.status(500).json({ message: "Database query error" });
                }
                return res.status(200).json({ message: "success" });
            });
        }
    });
});


// app.post('/professional_candidate', (req, res) => {
//     console.log(req.body, "professional_submission_candidate data");

//     const { First_Name, Last_Name, Email, Category_Selection, Region, link1, link2, link3 } = req.body;

//     if (!Email || !Category_Selection || !Region || !link1 || !link2 || !link3) {
//         return res.status(400).json({ message: 'Missing required fields' });
//     }

//     // Step 1: Check if the email already exists
//     const checkEmailSql = "SELECT * FROM professional_submission_candidate WHERE email = ?";
//     connection.query(checkEmailSql, [Email], (err, result) => {
//         if (err) {
//             console.error("Error checking email:", err);
//             return res.status(500).json({ message: 'Server error' });
//         }

//         if (result.length > 0) {
//             // Email already exists in the database
//             return res.status(409).json({ message: 'Email already exists' });
//         }

//         // Step 2: Insert the new record into the table
//         const insertSql = `
//             INSERT INTO professional_submission_candidate 
//             (First_Name, Last_Name, email, category_selection, region, link1, link2, link3) 
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
//         `;
//         connection.query(insertSql, [First_Name, Last_Name, Email, Category_Selection, Region, link1, link2, link3], (err, data) => {
//             if (err) {
//                 console.error("Database query error:", err);
//                 return res.status(500).json({ message: "Database query error" });
//             }

//             // Step 3: Get the last inserted ID
//             const insertedId = data.insertId;
//             console.log("Inserted Row ID:", insertedId);

//             // Step 4: Generate unique ID
//             const prefix = Category_Selection === 'Professional' ? 'Pr' : 'St';
//             const generateUniqueId = `${prefix}${insertedId}`;
//             console.log("Generated Unique ID:", generateUniqueId);

//             // Step 5: Update the inserted record with the generated unique ID
//             const updateSql = `
//                 UPDATE professional_submission_candidate 
//                 SET generateUniqueId = ? 
//                 WHERE id = ?
//             `;
//             connection.query(updateSql, [generateUniqueId, insertedId], (err, updateResult) => {
//                 if (err) {
//                     console.error("Error updating unique ID:", err);
//                     return res.status(500).json({ message: "Error updating unique ID" });
//                 }

//                 // Step 6: Send the response
//                 return res.status(200).json({ message: "success", data: updateResult });
//             });
//         });
//     });
// });




//all cadidate register data
app.get('/all_profession_candidate_data', (req, res) => {
    const sql = "select * from professional_submission_candidate";
    connection.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})
// all pre selected candidates data 
app.get('/all_preselected_candidate_data', (req, res) => {
    const sql = "select * from professional_submission_candidate";
    connection.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})
// East zone Candidates data
app.get('/professional_est_zone_candidate_data', (req, res) => {
    const sql = "select * from professional_submission_candidate where region = 'Kolkata [east zone]' limit 200";
    connection.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})
// West Zone Candidates Data 
app.get('/professional_west_zone_candidate_data', (req, res) => {
    const sql = "select * from professional_submission_candidate where region = 'Mumbai [West Zone]' limit 200";
    connection.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})
// south Zone Candidates Data 
app.get('/professional_south_zone_candidate_data', (req, res) => {
    const sql = "select * from professional_submission_candidate where region = 'Bengaluru [South Zone]' limit 200";
    connection.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})
// North Zone Candidates Data
app.get('/professional_north_zone_candidate_data', (req, res) => {
    const sql = "select * from professional_submission_candidate where region = 'Chandigarh [North Zone]' limit 200";
    connection.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})

// Student data API here... ====================================
app.get('/all_student_candidate_data', (req, res) => {
    const sql = "select * from student_submission_candidate";
    connection.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})

// top 10 Students Data
app.get('/to_ten_student_candidate_data', (req, res) => {
    const sql = "select * from student_submission_candidate";
    connection.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})

// East zone Student Candidates data
app.get('/student_est_zone_candidate_data', (req, res) => {
    const sql = "select * from student_submission_candidate where region = 'Kolkata [east zone]' limit 200";
    connection.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})


// West Zone Student Candidates Data 
app.get('/student_west_zone_candidate_data', (req, res) => {
    const sql = "select * from student_submission_candidate where region = 'Mumbai [West Zone]' limit 200";
    connection.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})

// North Zone Student Candidates Data
app.get('/student_north_zone_candidate_data', (req, res) => {
    const sql = "select * from student_submission_candidate where region = 'Chandigarh [North Zone]' limit 200";
    connection.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})

// south Zone Student Candidates Data 
app.get('/student_south_zone_candidate_data', (req, res) => {
    const sql = "select * from student_submission_candidate where region = 'Bengaluru [South Zone]' limit 200";
    connection.query(sql, (err, data) => {
        if (err) {
            return res.status(500).json({ Error: "Database query error" });
        }
        return res.status(200).json(data)
    })
})



// =================================================================
// registration table 
app.post('/register', (req, res) => {
    const email = req.body.email;

    // Check if email already exists
    const checkEmailSql = "SELECT * FROM login WHERE email = ?";
    connection.query(checkEmailSql, [email], (err, result) => {
        if (err) {
            console.error("Error in checking email:", err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (result.length > 0) {
            // Email already exists
            return res.status(409).json({ message: 'Email already exists' });
        } else {
            // Proceed with registration
            const sql = "INSERT INTO login (`first_name`, `last_name`,`company_name`, `email`, `mobile`, `password`) VALUES (?)";
            bcrypt.hash(req.body.password.toString(), saltRounds, (err, hash) => {
                if (err) {
                    console.error("Error in hashing password:", err);
                    return res.status(500).json({ message: 'Error in hashing password' });
                }

                const values = [
                    req.body.first_name,
                    req.body.last_name,
                    req.body.company_name,
                    req.body.email,
                    req.body.mobile,
                    hash
                ];

                connection.query(sql, [values], (err, result) => {
                    if (err) {
                        console.error("Error in inserting data:", err);
                        return res.status(500).json({ message: "Error inserting data" });
                    }
                    return res.status(200).json({ status: "Success", result });
                });
            });
        }
    });
});

// form api =====================

app.post('/login', (req, res) => {
    const sql = "select * from login where email =?";
    connection.query(sql, [req.body.email], (err, data) => {
        if (err) return res.json({ Error: "Login error in server" });
        if (data.length > 0) {
            bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
                if (err) return res.json({ Error: "password comparer error" });
                if (response) {
                    const name = data[0].first_name
                    const last_name = data[0].last_name
                    const token = jwt.sign({ name, last_name }, "secret_key_here", { expiresIn: '1d' });
                    res.cookie('token', token);
                    return res.json({ Status: "Success", data });
                } else {
                    return res.json({ Error: "password not matched" });
                }
            })
        } else {
            return res.json({ Error: "No email exitsed" });
        }
    })
})

app.get('/', verifyUser, (req, res) => {
    return res.json({ Status: "Success", name: req.name, last_name: req.last_name });
})

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    return res.json({ Status: "Success" });
})

// app.listen(5001, () => {
//     console.log("Server is running on port 5001");
// });

https.createServer(options, app).listen(5001, () => {
    console.log("Server is running on https://wafxselection.com:5001");
  });
