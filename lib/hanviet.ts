/**
 * Tên Hán Việt sang pinyin cho bản tiếng Anh (Lâm Huyền Lâm -> Lin Xuanlin, Thanh Thủy Village -> Qingshui Village).
 * Chỉ đổi những cụm chữ viết hoa mà mọi âm tiết đều có trong bảng; cụm có chữ lạ thì giữ nguyên.
 */
import { lang } from './i18n';

const PY: Record<string, string> = {
  an: 'an', âm: 'yin', ân: 'en', âu: 'ou', ám: 'an', ảnh: 'ying', ôn: 'wen',
  bàn: 'pan', bách: 'bai', báo: 'bao', bích: 'bi', bính: 'bing', bùi: 'pei', băng: 'bing', bạch: 'bai', bảo: 'bao', bắc: 'bei', bằng: 'peng', bồng: 'peng', bá: 'ba', bát: 'ba', bất: 'bu',
  can: 'gan', ca: 'ge', cát: 'ge', chân: 'zhen', châu: 'zhou', chưởng: 'zhang', chu: 'zhou', chi: 'zhi', chính: 'zheng', các: 'ge', cô: 'gu', côn: 'kun', công: 'gong', cơ: 'ji', cương: 'gang', cảnh: 'jing', cầm: 'qin', cố: 'gu', cốc: 'gu', cổ: 'gu', cung: 'gong', cực: 'ji',
  diệm: 'yan', diệp: 'ye', dung: 'rong', dương: 'yang', dạ: 'ye', dần: 'yin', dật: 'yi', dậu: 'you', dao: 'yao', di: 'yi', diêm: 'yan',
  gia: 'jia', giang: 'jiang', giáp: 'jia', giới: 'jie',
  hiên: 'xuan', hoa: 'hua', hoan: 'huan', hoàng: 'huang', huyết: 'xue', huyền: 'xuan', hà: 'he', hàm: 'han', hàn: 'han', hành: 'xing', hư: 'xu', hương: 'xiang', hạnh: 'xing', hạo: 'hao', hải: 'hai', hậu: 'hou', hắc: 'hei', hỏa: 'huo', hồ: 'hu', hồi: 'hui', hồn: 'hun', hổ: 'hu', hỗn: 'hun', hợi: 'hai', hợp: 'he', hoàn: 'huan', hạc: 'he',
  khuyết: 'que', khâu: 'qiu', khải: 'qi', khinh: 'qing', khí: 'qi', khôn: 'kun',
  kim: 'jin', kiếm: 'jian', kiếp: 'jie', kính: 'jing', kỳ: 'qi', kỵ: 'ji', kỷ: 'ji', kinh: 'jing',
  lai: 'lai', lang: 'lang', liễu: 'liu', long: 'long', luân: 'lun', ly: 'li', lâm: 'lin', lâu: 'lou', lão: 'lao', lôi: 'lei', lôn: 'lun', lý: 'li', lăng: 'ling', lư: 'lu', lạc: 'luo', lệnh: 'ling', lục: 'lu', linh: 'ling', lan: 'lan', liên: 'lian', lĩnh: 'ling',
  ma: 'mo', man: 'man', minh: 'ming', miêu: 'miao', mã: 'ma', mão: 'mao', môn: 'men', mùi: 'wei', mạc: 'mo', mậu: 'wu', mặc: 'mo', mộ: 'mu', mộc: 'mu', mộng: 'meng', mai: 'mei',
  nam: 'nan', nghệ: 'yi', nguyên: 'yuan', nguyệt: 'yue', ngôn: 'yan', ngưng: 'ning', ngọ: 'wu', nhi: 'er', nhâm: 'ren', nhân: 'ren', như: 'ru', nhạc: 'yue', nhất: 'yi', niên: 'nian', nông: 'nong', nại: 'nai', nữ: 'nu', nhai: 'ya', ngọc: 'yu', ngũ: 'wu', nghĩa: 'yi',
  oa: 'wa',
  phong: 'feng', phàm: 'fan', phúc: 'fu', phương: 'fang', phật: 'fo', phổ: 'pu', phủ: 'fu', phi: 'fei', phượng: 'feng',
  quan: 'guan', quân: 'jun', quý: 'gui', quả: 'guo', quỷ: 'gui', quang: 'guang',
  sa: 'sha', sinh: 'sheng', sát: 'sha', sơn: 'shan', sương: 'shuang', sở: 'chu', sửu: 'chou',
  thanh: 'qing', thiên: 'tian', thiết: 'tie', thiềm: 'chan', thái: 'tai', tháp: 'ta', thân: 'shen', thìn: 'chen', thôi: 'cui', thường: 'chang', thượng: 'shang', thạch: 'shi', thần: 'shen', thẩm: 'shen', thị: 'shi', thủy: 'shui', thừa: 'cheng', thi: 'shi', thu: 'qiu', thánh: 'sheng', thọ: 'shou',
  ti: 'si', tiêu: 'xiao', tiểu: 'xiao', tiên: 'xian', tinh: 'xing', trang: 'zhuang', triều: 'chao', trung: 'zhong', trường: 'chang', trượng: 'zhang', trạm: 'zhan', trần: 'chen', tuyết: 'xue', tuyệt: 'jue', tuất: 'xu', tà: 'xie', tâm: 'xin', tân: 'xin', tây: 'xi', tô: 'su', tôn: 'zun', tông: 'zong', tùng: 'song', tý: 'zi', tư: 'si', tương: 'xiang', tạ: 'xie', tạng: 'zang', tần: 'qin', tịch: 'xi', tố: 'su', tổ: 'zu', tử: 'zi', tỵ: 'si', tịnh: 'jing', tề: 'qi', tiền: 'qian',
  uyên: 'yuan', uyển: 'wan', trắng: 'bai',
  viên: 'yuan', viễn: 'yuan', vong: 'wang', vân: 'yun', vãn: 'wan', vô: 'wu', vũ: 'yu', vạn: 'wan', vị: 'wei', vọng: 'wang', vụ: 'wu', vực: 'yu', vương: 'wang',
  xuyên: 'chuan', xà: 'she', y: 'yi',
  yên: 'yan', yêu: 'yao', yến: 'yan', ỷ: 'qi',
  đinh: 'ding', điện: 'dian', điệp: 'die', đoạn: 'duan', đà: 'tuo', đào: 'tao', đông: 'dong', đường: 'tang', đại: 'da', đạo: 'dao', đầu: 'tou', địa: 'di', đồng: 'tong', độc: 'du', đế: 'di', đỉnh: 'ding', đan: 'dan', đình: 'ting',
};

const COMPOUND: Record<string, string> = {
  'âu dương': 'Ouyang', 'thượng quan': 'Shangguan', 'tư mã': 'Sima', 'nam cung': 'Nangong', 'độc cô': 'Dugu', 'lệnh hồ': 'Linghu',
  'hoàng phủ': 'Huangfu', 'mộ dung': 'Murong', 'đông phương': 'Dongfang', 'tây môn': 'Ximen', 'gia cát': 'Zhuge', 'công tôn': 'Gongsun',
};
const SURNAME = new Set(['tạ', 'phương', 'chu', 'ôn', 'cố', 'liễu', 'kỷ', 'sở', 'yến', 'mạc', 'thôi', 'lục', 'lâm', 'diệp', 'tô', 'hàn', 'lý', 'thẩm', 'bạch', 'giang', 'vân', 'tiêu', 'lạc', 'hoa', 'đường', 'tần', 'trần', 'vương', 'bùi', 'dương', 'hoàng', 'triệu', 'tống', 'hứa', 'mộ', 'nhạc', 'tề', 'đinh', 'khâu', 'quan', 'chân', 'lăng', 'tề']);
// từ chỉ loại nơi chốn đứng cuối cụm: dịch nghĩa, phần trước thành pinyin
const TYPE: Record<string, string> = { tông: 'Sect', môn: 'Sect', các: 'Pavilion', điện: 'Hall', lâu: 'Tower', cung: 'Palace', cốc: 'Valley', thôn: 'Village', trấn: 'Town' };
// cụm giữ nguyên
const KEEP = ['Vạn Kiếp Luân Hồi', 'Tiếng Việt', 'Cửa Nam', 'Tấm', 'Cám'];

const VN = /[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹĂÂĐÊÔƠƯ]/;
// âm tiết không dấu chỉ có trong tên Hán Việt (không trùng chữ tiếng Anh hay gặp)
const BARE = new Set(['thanh', 'linh', 'nhi', 'phong', 'giang', 'chu', 'hoa', 'dao', 'thi', 'khinh', 'nhai', 'chi', 'ly', 'lan', 'ca', 'tinh', 'kim', 'minh', 'quang', 'trang', 'trung', 'thu', 'sinh', 'nam', 'gia', 'dung', 'thien', 'huyen', 'lai']);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const TOK = /[A-ZÀ-ỸĐ][a-zà-ỹđ]*(?:[ -][A-ZÀ-ỸĐ][a-zà-ỹđ]*)*/g;

/** Một đoạn chỉ gồm âm tiết Hán Việt (có thể kết thúc bằng từ chỉ loại nơi chốn) sang pinyin */
function convertSeg(toks: string[]): string {
  const low = toks.map((t) => t.toLowerCase());
  const typeEn = low.length >= 2 ? TYPE[low[low.length - 1]] : undefined;
  const body = typeEn ? low.slice(0, -1) : low;
  let out: string;
  const two = body.slice(0, 2).join(' ');
  if (!typeEn && body.length >= 2 && COMPOUND[two]) {
    const given = body.slice(2).map((w) => PY[w]).join('');
    out = given ? `${COMPOUND[two]} ${cap(given)}` : COMPOUND[two];
  } else if (!typeEn && body.length >= 2 && body.length <= 3 && SURNAME.has(body[0])) {
    out = `${cap(PY[body[0]])} ${cap(body.slice(1).map((w) => PY[w]).join(''))}`;
  } else if (body.length <= 2) {
    out = cap(body.map((w) => PY[w]).join(''));
  } else {
    // cụm dài: ghép từng cặp âm tiết (Hỗn Nguyên Đạo Tổ -> Hunyuan Daozu)
    const parts: string[] = [];
    for (let i = 0; i < body.length; i += 2) parts.push(cap(body.slice(i, i + 2).map((w) => PY[w]).join('')));
    out = parts.join(' ');
  }
  return typeEn ? `${out} ${typeEn}` : out;
}

const marked = (t: string) => VN.test(t) || BARE.has(t.toLowerCase());

function convertRun(run: string): string {
  if (KEEP.some((k) => run.includes(k))) return run;
  const toks = run.split(/[ -]/);
  if (!toks.some(marked)) return run;
  const out: string[] = [];
  let i = 0;
  while (i < toks.length) {
    const w = toks[i].toLowerCase();
    if (w in PY) {
      let j = i;
      while (j < toks.length && toks[j].toLowerCase() in PY) j++;
      const seg = toks.slice(i, j);
      if (seg.some(marked)) {
        out.push(convertSeg(seg));
        i = j;
        continue;
      }
    }
    out.push(toks[i]);
    i++;
  }
  return out.join(' ');
}

/** Đổi mọi tên Hán Việt trong một đoạn chữ sang pinyin */
export function pinyinize(text: string): string {
  return text.replace(TOK, (run) => convertRun(run));
}

/** Tên lấy từ máy chủ hoặc bản lưu: bản tiếng Anh thì đổi sang pinyin */
export function nameOf(s: string | null | undefined): string {
  if (!s) return s ?? '';
  return lang() === 'en' ? pinyinize(s) : s;
}
