import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { signToken, signRegistrationToken, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/auth';
import { success, error, serverError } from '@/lib/apiResponse';
import { isInstitutionalEmail, STANDARD_PLATFORM_FEE_INR } from '@/lib/institutionPolicy';
import { isValidEmail, isValidStudentName } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      student_type,
      email,
      password,
      full_name,
      phone,
      college_name,
      roll_number,
      department,
      year_of_study,
      city,
      id_card_url,
    } = body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return error('Email, password and full name are required');
    }

    const emailLower = email.toLowerCase().trim();
    if (!isValidEmail(emailLower)) {
      return error('Please enter a valid email address');
    }

    const nameCheck = isValidStudentName(full_name);
    if (!nameCheck.valid) {
      return error(nameCheck.error || 'Student name is invalid');
    }

    if (password.length < 8) {
      return error('Password must be at least 8 characters');
    }

    // Check if Amrita student based on selection or recognized institutional email domain
    const isAmritaDomain = isInstitutionalEmail(emailLower);
    
    if (student_type === 'amrita' && !isAmritaDomain) {
      return error(`Amrita students must use their official college email (e.g., yourname@av.students.amrita.edu)`);
    }

    if (student_type === 'other') {
      if (!college_name?.trim()) return error('College / Institution name is required');
      if (!department?.trim()) return error('Branch / Department name is required');
      if (!city?.trim()) return error('City / Location is required');
    }

    if (student_type === 'amrita') {
      if (!roll_number?.trim()) return error('Amrita Roll Number is required');
      if (!department?.trim()) return error('Branch is required');
    }

    if (!year_of_study) {
      return error('Year of study is required');
    }

    const isAmritaStudent = student_type === 'amrita' || (student_type !== 'other' && isAmritaDomain);

    // Check if email already exists in users table
    const existing = await db.query(
      'SELECT id, email, platform_fee_paid, verification_status FROM users WHERE email = $1',
      [emailLower]
    );
    if (existing.rows.length > 0) {
      return error('An account with this email address already exists. Please log in.', 409);
    }

    const cleanPhone = (phone || '').replace(/\D/g, '').slice(0, 10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      return error('Phone number must be exactly 10 digits');
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return error('Phone number must start with 6, 7, 8, or 9 (excluding +91)');
    }

    // Hash password in server memory
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate unique QR token
    const qrToken = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '').slice(0, 8);
    const emailVerifyToken = uuidv4();

    // =========================================================================
    // 1. AMRITA STUDENT FLOW: Instantly verified, free pass, created in DB
    // =========================================================================
    if (isAmritaStudent) {
      const result = await db.query(
        `INSERT INTO users (
          email, password_hash, full_name, phone,
          college_name, is_amrita_student, roll_number, department,
          year_of_study, city, verification_status, qr_token,
          email_verify_token, email_verified, platform_fee_paid, id_card_url, pass_type
        ) VALUES ($1,$2,$3,$4,$5,TRUE,$6,$7,$8,$9,'verified',$10,$11,TRUE,TRUE,$12,'AMRITA_FREE')
        RETURNING id, email, full_name, role, is_amrita_student, verification_status, qr_token, platform_fee_paid, id_card_url, pass_type`,
        [
          emailLower,
          passwordHash,
          full_name,
          cleanPhone,
          'Amrita Vishwa Vidyapeetham, Amaravati',
          roll_number || null,
          department || null,
          year_of_study || null,
          city || null,
          qrToken,
          emailVerifyToken,
          id_card_url || null,
        ]
      );

      const user = result.rows[0];
      const token = await signToken({
        userId: user.id,
        email: user.email,
        role: user.role as 'student' | 'club_admin' | 'super_admin',
      });

      const response = success({
        user,
        is_amrita_student: true,
        requires_payment: false,
      }, 201);
      response.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
      return response;
    }

    // =========================================================================
    // 2. OUTSIDE STUDENT FLOW: Zero DB Writes Before Cashfree Payment
    // =========================================================================
    const { createCashfreeOrder } = await import('@/lib/cashfree');
    const cleanOrderId = `cf_reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let cfOrder: any;

    try {
      cfOrder = await createCashfreeOrder({
        order_id: cleanOrderId,
        order_amount: STANDARD_PLATFORM_FEE_INR,
        order_currency: 'INR',
        customer_details: {
          customer_id: `cand_${cleanPhone}`,
          customer_name: full_name,
          customer_email: emailLower,
          customer_phone: cleanPhone,
        },
        order_note: 'Parinaam 2026 Delegate Pass (₹1000)',
      });
    } catch (cfErr: any) {
      console.error('[Cashfree Registration Order Error]', cfErr);
      return error(`Payment gateway initialization failed: ${cfErr.message || 'Unable to create Cashfree payment session'}`, 502);
    }

    // Create encrypted registration_token containing registration payload & order binding
    const regToken = await signRegistrationToken({
      type: 'platform_fee',
      order_id: cfOrder.order_id,
      email: emailLower,
      password_hash: passwordHash,
      full_name,
      phone: cleanPhone,
      college_name,
      roll_number: roll_number || null,
      department: department || null,
      year_of_study: year_of_study || null,
      city: city || null,
      id_card_url: id_card_url || null,
      qr_token: qrToken,
      emailVerifyToken,
    });

    const orderData = {
      order_id: cfOrder.order_id,
      cf_order_id: cfOrder.cf_order_id,
      payment_session_id: cfOrder.payment_session_id,
      registration_token: regToken,
      amount: STANDARD_PLATFORM_FEE_INR * 100, // paise
      amount_in_rupees: STANDARD_PLATFORM_FEE_INR,
      currency: 'INR',
      description: 'PARINAAM 2026 Festival Pass (₹1000 Fixed Entry)',
      included_events: [
        'Live Concert and DJ',
        'Garba Night',
        'Auto Expo',
        'Tholu Bommalata',
      ],
    };

    // Return Cashfree order data & registration token to client.
    // ZERO DB writes performed (no users row, no payments row, no session cookie).
    return success({
      user: null,
      is_amrita_student: false,
      requires_payment: true,
      cashfree_order: orderData,
      razorpay_order: orderData,
    }, 201);
  } catch (err: any) {
    console.error('Registration error:', err);
    return error(err?.message || 'Registration failed. Please try again.', 500);
  }
}
