const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY  // service key, not anon key
);

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        cartItems,
        totalAmount,
        customerName,
        customerEmail,
        customerPhone,
    } = req.body;

    // Step 1: Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, error: "Invalid payment signature" });
    }

    // Step 2: Save confirmed order to Supabase
    try {
        const { data, error } = await supabase.from("orders").insert([
            {
                razorpay_order_id,
                razorpay_payment_id,
                amount: totalAmount,
                cart_items: cartItems,
                customer_name: customerName || null,
                customer_email: customerEmail || null,
                customer_phone: customerPhone || null,
                status: "paid",
                created_at: new Date().toISOString(),
            },
        ]);

        if (error) throw error;

        res.status(200).json({ success: true, orderId: razorpay_order_id });

    } catch (err) {
        console.error("Supabase save error:", err);
        // Payment was real but DB save failed — still return success
        // but log it so you can manually check
        res.status(200).json({
            success: true,
            warning: "Payment confirmed but order save failed. Contact support.",
            orderId: razorpay_order_id
        });
    }
};