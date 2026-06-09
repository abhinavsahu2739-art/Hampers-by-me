const Razorpay = require("razorpay");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = async (req, res) => {
    // Allow only POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { amount, cartItems, customerName, customerEmail, customerPhone } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }

        const order = await razorpay.orders.create({
            amount: amount * 100, // convert ₹ to paise
            currency: "INR",
            receipt: "receipt_" + Date.now(),
            notes: {
                cart_summary: cartItems ? JSON.stringify(cartItems) : "",
                customer_name: customerName || "",
                customer_email: customerEmail || "",
            },
        });

        res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
        });

    } catch (err) {
        console.error("Razorpay create order error:", err);
        res.status(500).json({ error: "Failed to create order" });
    }
};