-- Check the user matching this phone, and their current login OTP row.

SELECT id, name_en, name_kh, phone, email, is_active, telegram_id
FROM "user"."user"
WHERE phone = '087600063';

SELECT o.id, o.user_id, o.otp, o.otp_token, o.purpose, o.channel, o.expires_at, o.created_at
FROM "user"."user_otp" o
JOIN "user"."user" u ON u.id = o.user_id
WHERE u.phone = '087600063'
ORDER BY o.id DESC
LIMIT 5;
