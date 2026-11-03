import { useEffect, useRef, useState } from 'react';
import {
  Facebook,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  X,
  Youtube,
} from 'lucide-react';
import './floating-contact.css';

// ============================================================
// RATAN LAL SARAF — EDIT YOUR CONTACT DETAILS HERE
// Leave a field empty to show its icon as disabled.
// No .env file, admin settings, or backend request is needed.
// ============================================================
const CONTACT_CONFIG = {
  whatsapp: '9685057574', // Indian number, with or without +91
  phone: '9685057574',               // Example: '9876543210'
  instagram: 'https://www.instagram.com/',           // Full profile URL: https://www.instagram.com/...
  facebook: 'https://www.facebook.com/',            // Full page URL: https://www.facebook.com/...
  youtube: 'https://www.youtube.com/',             // Full channel URL: https://www.youtube.com/@...
  googleMaps: 'https://www.google.com/maps/place/RATAN+LAL+SARAF+GWALIOR/@26.2014464,78.1506222,17z/data=!3m1!4b1!4m6!3m5!1s0x3976c5d180448377:0x7a38c5c3804e1b70!8m2!3d26.2014464!4d78.1506222!16s%2Fg%2F11f1220x_z?entry=ttu&g_ep=EgoyMDI2MTAyOC4wIKXMDSoASAFQAw%3D%3D',          // Full store-location URL: https://maps.app.goo.gl/...
};

function phoneDigits(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`;
  if (/^0[6-9]\d{9}$/.test(digits)) return `91${digits.slice(1)}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return digits;
  // Allow other international numbers only when a country code is supplied.
  return /^\d{11,15}$/.test(digits) ? digits : '';
}

function validUrl(value) {
  if (!value || !String(value).trim()) return '';
  try {
    const url = new URL(String(value).trim());
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

export default function FloatingContact() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handleOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeydown(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [open]);

  const whatsapp = phoneDigits(CONTACT_CONFIG.whatsapp);
  const phone = phoneDigits(CONTACT_CONFIG.phone);

  // All six icons remain visible, even when their links are empty.
  const contactItems = [
    {
      name: 'whatsapp',
      label: 'WhatsApp',
      Icon: MessageCircle,
      href: whatsapp
        ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(
            'Hello Ratan Lal Saraf, I would like to enquire about jewellery.'
          )}`
        : '',
      external: true,
    },
    {
      name: 'phone',
      label: 'Call Us',
      Icon: Phone,
      href: phone ? `tel:+${phone}` : '',
      external: false,
    },
    {
      name: 'instagram',
      label: 'Instagram',
      Icon: Instagram,
      href: validUrl(CONTACT_CONFIG.instagram),
      external: true,
    },
    {
      name: 'facebook',
      label: 'Facebook',
      Icon: Facebook,
      href: validUrl(CONTACT_CONFIG.facebook),
      external: true,
    },
    {
      name: 'youtube',
      label: 'YouTube',
      Icon: Youtube,
      href: validUrl(CONTACT_CONFIG.youtube),
      external: true,
    },
    {
      name: 'maps',
      label: 'Google Maps',
      Icon: MapPin,
      href: validUrl(CONTACT_CONFIG.googleMaps),
      external: true,
    },
  ];

  return (
    <div className="rls-floating-contact" ref={rootRef}>
      {open && (
        <nav
          className="rls-floating-options"
          id="rls-contact-options"
          aria-label="Contact and social media"
        >
          {contactItems.map(({ name, label, Icon, href, external }, index) => {
            const enabled = Boolean(href);
            const className = `rls-floating-link rls-floating-${name}${
              enabled ? '' : ' rls-floating-disabled'
            }`;
            const style = { '--rls-stagger': `${index * 40}ms` };
            const content = (
              <>
                <span className="rls-floating-label">{label}</span>
                <span className="rls-floating-icon" aria-hidden="true">
                  <Icon size={21} strokeWidth={2} />
                </span>
              </>
            );

            return enabled ? (
              <a
                key={name}
                className={className}
                style={style}
                href={href}
                aria-label={label}
                title={label}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                onClick={() => setOpen(false)}
              >
                {content}
              </a>
            ) : (
              <button
                key={name}
                type="button"
                className={className}
                style={style}
                title={`${label} is not configured`}
                aria-label={`${label} is not configured`}
                disabled
              >
                {content}
              </button>
            );
          })}
        </nav>
      )}

      <button
        type="button"
        className={`rls-floating-trigger${open ? ' rls-floating-trigger-open' : ''}`}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={open ? 'rls-contact-options' : undefined}
        aria-label={open ? 'Close contact shortcuts' : 'Open contact shortcuts'}
        title={open ? 'Close' : 'Contact us'}
      >
        {open ? <X size={25} /> : <MessageCircle size={26} />}
        {!open && <span className="rls-floating-pulse" aria-hidden="true" />}
      </button>
    </div>
  );
}
