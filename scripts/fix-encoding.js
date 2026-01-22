const fs = require('fs');

// Fix NakliyeciSidebar
const nakliyeci = 'src/components/navigation/NakliyeciSidebar.tsx';
let content1 = fs.readFileSync(nakliyeci, 'utf8');
const fixes1 = {
  'Ana Menü¼': 'Ana Menü',
  'YÃ¼k PazarÄ±': 'Yük Pazarı',
  'Aktif YÃ¼kler': 'Aktif Yükler',
  'GÃ¶nderilerim': 'Gönderilerim',
  'TaÅŸÄ±yÄ±cÄ±larÄ±m': 'Taşıyıcılarım',
  'Ä°lanlarÄ±m': 'İlanlarım',
  'AkÄ±llÄ± Rota': 'Akıllı Rota',
  'CÃ¼zdan': 'Cüzdan',
  'Ä°letiÅŸim': 'İletişim',
  'YardÄ±m': 'Yardım',
  'HÄ±zlÄ± Lojistik A.ÅŸ.': 'Hızlı Lojistik A.Ş.'
};
Object.keys(fixes1).forEach(k => {
  content1 = content1.split(k).join(fixes1[k]);
});
fs.writeFileSync(nakliyeci, content1, 'utf8');
console.log('✅ NakliyeciSidebar encoding fixed');

// Fix TasiyiciSidebar
const tasiyici = 'src/components/navigation/TasiyiciSidebar.tsx';
let content2 = fs.readFileSync(tasiyici, 'utf8');
const fixes2 = {
  'Ana Menü¼': 'Ana Menü',
  'Ä°ÅŸ PazarÄ±': 'İş Pazarı',
  'Aktif Ä°ÅŸler': 'Aktif İşler',
  'Tamamlanan Ä°ÅŸler': 'Tamamlanan İşler',
  'YardÄ±m': 'Yardım',
  'TaÅŸÄ±yÄ±cÄ± Hesap': 'Taşıyıcı Hesap'
};
Object.keys(fixes2).forEach(k => {
  content2 = content2.split(k).join(fixes2[k]);
});
fs.writeFileSync(tasiyici, content2, 'utf8');
console.log('✅ TasiyiciSidebar encoding fixed');









