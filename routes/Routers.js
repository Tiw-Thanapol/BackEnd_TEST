const express = require('express');
const router = express.Router();
const prisma = require('../prisma/prisma');  // นำเข้า Prisma client

// METHOD POST Create Hotel
router.post('/create/hotel', async (req, res) => {
    const { name, price, doingtime } = req.body;  // รับค่า doingtime จาก body

    // ตรวจสอบว่า doingtime มีค่าหรือไม่
    if (!doingtime) {
        return res.status(400).json({
            RespCode: 400,
            RespMessage: "bad: Missing doingtime",
        });
    }

    try {
        // แปลง doingtime จาก String เป็น Date
        const formattedDoingtime = new Date(doingtime);

        // ตรวจสอบว่า doingtime ที่แปลงเป็นวันที่ถูกต้องหรือไม่
        if (isNaN(formattedDoingtime.getTime())) {
            return res.status(400).json({
                RespCode: 400,
                RespMessage: "bad: Invalid doingtime format, expected YYYY-MM-DD HH:mm:ss",
            });
        }

        // ใช้ Prisma เพื่อบันทึกข้อมูล
        const hotel = await prisma.tbl_hotel.create({
            data: {
                name: name,
                price: price,
                doingtime: formattedDoingtime
            }
        });

        // ส่งข้อมูลที่บันทึกแล้วกลับไปยัง client
        res.json({
            RespCode: 200,
            RespMessage: "success",
            Result: [{
                id: hotel.id,  // ดึง id จากที่ Prisma คืนมา
                name: hotel.name,
                price: hotel.price,
                doingtime: hotel.doingtime
            }]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            RespCode: 500,
            RespMessage: "Internal Server Error",
        });
    }
});
// METHOD GET List Hotel data by id
router.get('/listhotel/:id?', async (req, res) => {
    const { id } = req.params;  // ดึง id จาก params

    try {
        let hotels;
        if (id) {
            // หากมี id ให้ดึงโรงแรมที่ตรงกับ id
            hotels = await prisma.tbl_hotel.findUnique({
                where: {
                    id: parseInt(id),  // แปลง id ที่รับมาจาก string เป็น int
                },
            });

            // ตรวจสอบหากไม่พบข้อมูลโรงแรม
            if (!hotels) {
                return res.status(404).json({
                    RespCode: 404,
                    RespMessage: "Hotel not found",
                });
            }
        } else {
            // หากไม่มี id ให้ดึงข้อมูลทุกโรงแรม
            hotels = await prisma.tbl_hotel.findMany();
        }

        // ส่ง Response กลับ
        return res.status(200).json({
            RespCode: 200,
            RespMessage: "success",
            Result: Array.isArray(hotels) ? hotels : [hotels],  // ตรวจสอบและแปลงให้เป็น array
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            RespCode: 500,
            RespMessage: "Internal Server Error",
        });
    }
});

// METHOD POST Search Hotel by date
router.post('/search/hotel', async (req, res) => {
    const { date } = req.body;  // ดึง date จาก request body

    if (!date) {
        return res.status(400).json({
            RespCode: 400,
            RespMessage: "Bad request: Missing date parameter",
        });
    }

    try {
        // แปลง date ที่ได้รับมาเป็นวันที่ในรูปแบบ YYYY-MM-DD
        const startDate = new Date(date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);  // เพิ่ม 1 วันเพื่อเป็นช่วงเวลาระหว่างวันที่

        // ค้นหาโรงแรมที่มี doingtime ตรงกับวันที่ที่ระบุ
        const hotels = await prisma.tbl_hotel.findMany({
            where: {
                doingtime: {
                    gte: startDate,  // ทำการค้นหาตั้งแต่วันที่เริ่มต้น
                    lt: endDate,     // จนถึงวันที่สิ้นสุด (ไม่รวมวันที่ถัดไป)
                },
            },
        });

        if (hotels.length === 0) {
            return res.status(404).json({
                RespCode: 404,
                RespMessage: "No hotels found for the given date",
            });
        }

        // ส่ง Response กลับ
        return res.status(200).json({
            RespCode: 200,
            RespMessage: "success",
            Result: hotels.map(hotel => ({
                id: hotel.id,
                name: hotel.name,
                price: hotel.price,
                doingtime: hotel.doingtime.toISOString().replace("T", " ").split(".")[0], // แปลงเวลาเป็น "YYYY-MM-DD HH:mm:ss"
            })),
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            RespCode: 500,
            RespMessage: "Internal Server Error",
        });
    }
});

// METHOD GET Dashboard statics Hotel
router.get('/dashboard/hotel', async (req, res) => {
    try {
        // ค้นหาทุกโรงแรม
        const hotels = await prisma.tbl_hotel.findMany();

        if (hotels.length === 0) {
            return res.status(404).json({
                RespCode: 404,
                RespMessage: "No hotels found",
            });
        }

        // คำนวณข้อมูลสถิติ
        const allHotelsCount = hotels.length;
        const highestPriceHotel = hotels.reduce((prev, current) => (prev.price > current.price) ? prev : current);
        const lowestPriceHotel = hotels.reduce((prev, current) => (prev.price < current.price) ? prev : current);
        const lastHotelAdded = hotels.reduce((prev, current) => (new Date(prev.doingtime) > new Date(current.doingtime)) ? prev : current);

        // สร้าง Response
        res.json({
            RespCode: 200,
            RespMessage: "success",
            Result: {
                Data: hotels.map(hotel => ({
                    id: hotel.id,
                    name: hotel.name,
                    price: hotel.price,
                    doingtime: hotel.doingtime.toISOString().replace("T", " ").split(".")[0],  // แปลงเวลาเป็น "YYYY-MM-DD HH:mm:ss"
                })),
                Dashboard: {
                    AllHotel: allHotelsCount,
                    Price: {
                        High: highestPriceHotel.name,
                        Low: lowestPriceHotel.name,
                    },
                    LastHotelAdd: lastHotelAdded.doingtime.toISOString().replace("T", " ").split(".")[0], // แสดงเวลาของโรงแรมล่าสุด
                },
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            RespCode: 500,
            RespMessage: "Internal Server Error",
        });
    }
});

///////////////////////////////////////////////////////////////////


// METHOD PUT Update hotel data
router.put('/update/hotel', async (req, res) => {
    const { id, name, price, doingtime } = req.body;

    if (!id) {
        return res.status(400).json({
            RespCode: 400,
            RespMessage: "Hotel ID is required",
        });
    }

    try {
        // ค้นหาข้อมูลโรงแรมที่ต้องการอัปเดต
        const hotel = await prisma.tbl_hotel.findUnique({
            where: { id: Number(id) }, // แปลง id เป็นตัวเลข
        });

        if (!hotel) {
            return res.status(404).json({
                RespCode: 404,
                RespMessage: "Hotel not found",
            });
        }

        // ตรวจสอบว่า price เป็นตัวเลข ถ้าไม่ใช่ให้ใช้ค่าจากฐานข้อมูล
        const updatedPrice = price !== undefined ? parseInt(price, 10) : hotel.price;

        // ตรวจสอบว่า doingtime เป็นวันที่ที่ถูกต้อง
        const updatedDoingTime = doingtime && !isNaN(new Date(doingtime).getTime()) 
            ? new Date(doingtime) 
            : hotel.doingtime;

        const updatedHotel = await prisma.tbl_hotel.update({
            where: { id: Number(id) },
            data: {
                name: name || hotel.name,  
                price: updatedPrice,  
                doingtime: updatedDoingTime,  
            },
        });

        res.json({
            RespCode: 200,
            RespMessage: "success",
            Result: [{
                id: updatedHotel.id,
                name: updatedHotel.name,
                price: updatedHotel.price,
                doingtime: updatedHotel.doingtime
                    ? updatedHotel.doingtime.toISOString().replace("T", " ").split(".")[0]
                    : null,
            }],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            RespCode: 500,
            RespMessage: "Internal Server Error",
        });
    }
});

// METHOD DELETE Remove hotel
router.delete('/delete/hotel', async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({
            RespCode: 400,
            RespMessage: "Hotel ID is required",
        });
    }

    try {
        // ค้นหาข้อมูลโรงแรมที่ต้องการลบ
        const hotel = await prisma.tbl_hotel.findUnique({
            where: { id: id },
        });

        if (!hotel) {
            return res.status(404).json({
                RespCode: 404,
                RespMessage: "Hotel not found",
            });
        }

        // ลบข้อมูลโรงแรม
        await prisma.tbl_hotel.delete({
            where: { id: id },
        });

        // ส่งข้อความตอบกลับว่าลบสำเร็จ
        res.json({
            RespCode: 200,
            RespMessage: "success",
            Result: [{
                message: "Hotel successfully deleted",
                id: id,
            }],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            RespCode: 500,
            RespMessage: "Internal Server Error",
        });
    }
});

module.exports = router;
