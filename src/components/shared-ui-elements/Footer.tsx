import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import YolNextLogo from './yolnextLogo';
import { LEGAL_CONTACT } from '../../config/legal';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo ve Açıklama */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center justify-start mb-4">
              <YolNextLogo variant='banner' size='lg' showText={false} />
            </div>
            <p className="text-slate-300 mb-4 max-w-md">
              Türkiye'nin en güvenilir lojistik platformu. Göndericiler ve nakliyecileri 
              bir araya getirerek taşımacılık sektörüne yeni bir soluk getiriyoruz.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-gradient-to-r from-slate-800 to-blue-900 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-blue-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:from-blue-900 hover:to-slate-800 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-pink-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Hızlı Linkler */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Hızlı Linkler</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-slate-300 hover:text-white transition-colors">
                  Hakkımızda
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-300 hover:text-white transition-colors">
                  İletişim
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-300 hover:text-white transition-colors">
                  Giriş Yap
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-slate-300 hover:text-white transition-colors">
                  Kayıt Ol
                </Link>
              </li>
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Yasal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-slate-300 hover:text-white transition-colors">
                  Kullanım Koşulları
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-300 hover:text-white transition-colors">
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="text-slate-300 hover:text-white transition-colors">
                  Çerez Politikası
                </Link>
              </li>
              <li>
                <Link to="/kvkk-aydinlatma" className="text-slate-300 hover:text-white transition-colors">
                  KVKK Aydınlatma Metni
                </Link>
              </li>
              <li>
                <Link to="/consumer-rights" className="text-slate-300 hover:text-white transition-colors">
                  Tüketici Hakları
                </Link>
              </li>
              <li>
                <Link
                  to="/distance-selling-contract"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Mesafeli Satış Sözleşmesi
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.dispatchEvent(new Event('yolnext:cookie-preferences'));
                    } catch {
                      // ignore
                    }
                  }}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  Çerez Tercihleri
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* İletişim Bilgileri */}
        <div className="border-t border-slate-800 mt-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-blue-400 mr-3 mt-1" />
              <div>
                <p className="text-sm text-slate-400">E-posta</p>
                <a
                  href={`mailto:${LEGAL_CONTACT.supportEmail}`}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  {LEGAL_CONTACT.supportEmail}
                </a>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="w-5 h-5 text-blue-400 mr-3 mt-1" />
              <div>
                <p className="text-sm text-slate-400">Telefon</p>
                <a
                  href={`tel:${String(LEGAL_CONTACT.phone).replace(/[^\d+]/g, '')}`}
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  {LEGAL_CONTACT.phone}
                </a>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-blue-400 mr-3 mt-1" />
              <div>
                <p className="text-sm text-slate-400">Adres</p>
                <p className="text-slate-300">{LEGAL_CONTACT.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-800 mt-8 pt-8 text-center">
          <p className="text-slate-400 text-sm">
            © {new Date().getFullYear()} {LEGAL_CONTACT.companyName}. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;












