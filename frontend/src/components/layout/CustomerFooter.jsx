import React from 'react';
import { Link } from 'react-router-dom';
import { Cross, Phone, Mail, MapPin, ShieldCheck, CreditCard, HeartHandshake } from 'lucide-react';

export default function CustomerFooter() {
  return (
    <footer className="customer-footer">
      <div className="customer-footer-inner">
        {/* Column 1: Pharmacy Brand & Trust */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Cross size={18} strokeWidth={2.7} />
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
              Pharma<span style={{ color: '#2dd4bf' }}>Care</span> Pro
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#94a3b8', marginBottom: '1.25rem' }}>
            Your accredited community pharmacy and medical supply partner. Dedicated to providing 100% genuine pharmaceuticals, certified pharmacist consultations, and rapid doorstep delivery across the island.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
              <MapPin size={16} color="#2dd4bf" /> 108 Healthcare Blvd, Colombo 03, Sri Lanka
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
              <Phone size={16} color="#2dd4bf" /> +94 11 234 5678 (24/7 Hotline)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1' }}>
              <Mail size={16} color="#2dd4bf" /> support@pharmacarepro.lk
            </span>
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="customer-footer-title">Pharmacy Shop</h4>
          <ul className="customer-footer-links">
            <li><Link to="/products">All Medicines</Link></li>
            <li><Link to="/products?category=1">Prescription Drugs</Link></li>
            <li><Link to="/products?category=2">Pain Relief & Fever</Link></li>
            <li><Link to="/products?category=3">Vitamins & Wellness</Link></li>
            <li><Link to="/cart">My Cart</Link></li>
          </ul>
        </div>

        {/* Column 3: Customer Care & Services */}
        <div>
          <h4 className="customer-footer-title">Customer Care</h4>
          <ul className="customer-footer-links">
            <li><Link to="/account?tab=orders">Track Orders</Link></li>
            <li><Link to="/account?tab=prescriptions">Upload Prescription</Link></li>
            <li><Link to="/account?tab=support">Contact Pharmacist</Link></li>
            <li><Link to="/account?tab=loyalty">Loyalty Rewards</Link></li>
            <li><Link to="/login">Account Login</Link></li>
          </ul>
        </div>

        {/* Column 4: Quality & Trust Assurances */}
        <div>
          <h4 className="customer-footer-title">Quality Assurance</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <ShieldCheck size={20} color="#2dd4bf" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#ffffff', display: 'block' }}>NMRA Licensed</strong>
                <span>Fully registered pharmacy under the National Medicines Regulatory Authority.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <HeartHandshake size={20} color="#2dd4bf" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#ffffff', display: 'block' }}>Verified Pharmacists</strong>
                <span>Every prescription order is verified by a qualified pharmacist.</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <CreditCard size={20} color="#2dd4bf" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#ffffff', display: 'block' }}>Flexible Payments</strong>
                <span>Cash on delivery, bank transfer, and direct card transactions supported.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="customer-footer-bottom">
        <div>
          © {new Date().getFullYear()} PharmaCare Pro. All rights reserved. Registered Healthcare Provider.
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>Privacy Policy</span>
          <span>Terms of Sale</span>
          <span>Pharmacist Code of Ethics</span>
        </div>
      </div>
    </footer>
  );
}
