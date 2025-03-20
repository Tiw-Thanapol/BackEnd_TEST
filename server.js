const express = require('express')
const mysql = require('mysql');
const _ = require('lodash')
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const server = app.listen(3000, () => {
    console.log('Nodejs is running on port 3000!')
})


var db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: 'hotel_db'
});

db.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

//METHOD POST CREATE HOTEL
app.post('/api/create/hotel', (req, res) => {
    console.log('Received Body:', req.body);
    var name = _.get(req, ["body", "name"]);
    var price = _.get(req, ["body", "price"]);
    var doingtime = _.get(req, ["body", "doingtime"]);

    try {
        if (name && price) {
            db.query(
                'INSERT INTO tbl_hotel (name,price, doingtime) VALUES (?,?,?)',
                [name, price, doingtime],
                (err, result) => {
                    if (err) {
                        console.log('Error 2!: Bad SQL', err)
                        return res.status(400).json({
                            RespCode: 400,
                            RespMessage: 'bad: SQL error',
                            Log: 2
                        })
                    }
                    return res.status(200).json({
                        RespCode: 200,
                        RespMessage: 'SUCCESS!',
                        Result: [{
                            id: result.insertId,
                            name: name,
                            price: price,
                            doingtime: doingtime
                        }]
                    })
                }
            )
        } else {
            console.log('Error 1! : Invalid request')
            return res.status(400).json({
                RespCode: 400,
                RespMessage: 'bad: Invalid request',
                Log: 1
            })
        }
    }
    catch (error) {
        console.log('Error 0!:', error)
        return res.status(400).json({
            RespCode: 400,
            RespMessage: 'bad: Unexpected error',
            Log: 0
        })
    }
})


//METHOD GET ListHotel
app.get('/api/listhotel/:id?', (req, res) => {
    console.log('Received Params:', req.params);
    var id = _.get(req, ["params", "id"], null);

    try {
        let sql;
        let values = [];

        if (id) {
            sql = 'SELECT * FROM tbl_hotel WHERE id = ?';
            values = [id];
        } else {
            sql = 'SELECT * FROM tbl_hotel';
        }

        db.query(sql, values, (err, results) => {
            if (err) {
                console.log('Error 1!: SQL Query Failed', err);
                return res.status(500).json({
                    RespCode: 500,
                    RespMessage: 'Error: Database Query Failed',
                    Log: 1
                });
            }

            return res.status(200).json({
                RespCode: 200,
                RespMessage: 'Success',
                Result: results
            });
        });
    } catch (error) {
        console.log('Error 0!: Exception', error);
        return res.status(500).json({
            RespCode: 500,
            RespMessage: 'Server Error',
            Log: 0
        });
    }
});


//METHOD POST Search Hotel

app.post('/api/search/hotel', (req, res) => {
    const { date } = req.body

    if (!date) {
        return res.status(400).json({
            RespCode: 400,
            RespMessage: "Missing required field: date"
        })
    }

    let sql = " SELECT id, name , price, doingtime FROM tbl_hotel WHERE DATE(doingtime)=?"

    db.query(sql, [date], (err, results) => {
        if (err) {
            console.log('Error 1!: Database Error')
            return res.status(500).json({
                RespCode: 500,
                RespMessage: "Database Error",
                Error: 1
            })
        }

        return res.json({
            RespCode: 200,
            RespMessage: "Success!",
            Result: results
        })
    })
})

// METHOD GET Dashboard Hotel
app.get('/api/dashboard/hotel', (req, res) => {
    try {
        let sql = 'SELECT * FROM tbl_hotel'
        db.query(sql, (err, results) => {
            if (err) {
                console.log('Error 1!: SQL Query Failed', err)
                return res.status(500).json({
                    RespCode: 500,
                    RespMessage: 'Error: Database Query Failed',
                    Log: 1
                })
            }

            const allHotelCount = results.length

            let highPriceHotel = results.reduce((prev, current) => (prev.price > current.price) ? prev: current)
            let lowPriceHotel = results.reduce((prev, current) => (prev.price < current.price) ? prev: current)

            let lastHotelAdd = results.reduce((prev, current) => (new Date(prev.doingrime))? prev : current)
            
            const dashboardData = {
                Data: results.map(hotel => ({
                    id: hotel.id,
                    name:hotel.name,
                    price: hotel.price,
                    doingtime: hotel.doingtime
                })),
                Dashboard: {
                    AllHotel: allHotelCount,
                    Price: {
                        High: highPriceHotel.name,
                        Low: lowPriceHotel.name
                    },
                    LastHotelAdd: lastHotelAdd.doingtime
                }
            }

            return res.status(200).json({
                RespCode: 200,
                RespMessage: 'Success!',
                Result: dashboardData
            })
        })
    }
    catch (error) {
        console.log('Error 0! : Exception', error)
        return res.status(500).json({
            RespCode: 500,
            RespMessage: 'Server Error!',
            Log: 0
        })
    }
})
///////////////////////////////////////////////////////////////////////

//METHOD PUT Update Hotel
app.put('/api/update/hotel', (req, res) => {
    var id = _.get(req, ["body", "id"])
    var name = _.get(req, ["body", "name"])
    var price = _.get(req, ["body", "price"])
    var doingtime = _.get(req, ["body", "doingtime"])
    try {
        if (id && name && price && doingtime) {
            db.query('update tbl_hotel SET name =? , price=? , doingtime=? where id =?', [
                name, price, doingtime, parseInt(id)
            ], (err, data, fil) => {
                if (data) {
                    return res.status(200).json({
                        RespCode: 200,
                        RespMessage: 'Success!'
                    })
                }
                else {
                    console.log('Error 2!: Update fail')
                    return res.status(400).json({
                        RespCode: 400,
                        RespMessage: ' bad: Update fail',
                        Log: 2
                    })
                }
            }
            )
        }
        else {
            console.log('Error 1!: Invalid data')
            return res.status(400).json({
                RespCode: 400,
                RespMessage: ' bad: Invalid data',
                Log: 1
            })
        }
    }
    catch (error) {
        console.log('Error 0! :', error)
        return res.status(500).json({
            respCode: 500,
            respMessage: 'bad :Invalid request',
            Log: 0
        })
    }
})

// METHOD Delete By Id
app.delete('/api/delete/hotel/:id?', (req, res) => {
    var id = _.get(req, ["params", "id"])
    try {
        if (id) {
            db.query('delete from tbl_hotel where id=?', [
                parseInt(id)
            ], (err, resp ) => {
                if (resp) {
                    return res.status(200).json({
                        RespCode: 200,
                        RespMessage: 'Delete Success!'
                    })
                }
                else {
                    console.log('Error 2!: Bad SQL')
                    return res.status(400).json({
                        RespCode: 400,
                        RespMessage: ' bad: SQL Error',
                        Log: 2
                    })
                }
            }
            )
        }
        else {
            console.log('Error 1!: Invalid data')
            return res.status(400).json({
                RespCode: 400,
                RespMessage: ' bad: Invalid data',
                Log: 1
            })
        }
    }
    catch (error) {
        console.log('Error 0!: Unexpected error', error)
        return res.status(500).json({
            respCode: 500,
            respMessage: 'bad :Server error',
            Log: 0
        })
    }
})







module.exports = app