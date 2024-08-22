import rateLimit from "express-rate-limit";

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 20,
    standardHeaders: 'draft-7',
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: { message: `Too many requests. Please try again later...` }
});

export default limiter;