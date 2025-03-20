const prisma = require('../prisma/prisma');

exports.register = async (req, res) => {
    try {
        const { name, price, doingtime } = req.body;

        if (!name || !price || !doingtime) {
            return res.status(400).json({
                RespCode: 400,
                RespMessage: "bad: Invalid request, missing parameters",
                Log: 1
            });
        }

        const formattedDoingtime = new Date(doingtime);
        if (isNaN(formattedDoingtime.getTime())) {
            return res.status(400).json({
                RespCode: 400,
                RespMessage: "bad: Invalid doingtime format, expected YYYY-MM-DD HH:mm:ss",
                Log: 2
            });
        }

        const hotel = await prisma.tbl_hotel.create({
            data: {
                name: name,
                price: price.toString(),
                doingtime: formattedDoingtime
            }
        });

        return res.status(200).json({
            RespCode: 200,
            RespMessage: "success",
            Result: [{
                id: hotel.id,
                name: hotel.name,
                price: hotel.price,
                doingtime: hotel.doingtime.toISOString().replace("T", " ").split(".")[0] 
            }]
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            RespCode: 500,
            RespMessage: "bad: Unexpected error",
            Log: 0
        });
    }
};
