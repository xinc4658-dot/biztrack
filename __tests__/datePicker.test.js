import { datePickerI18n } from '../i18n/datePicker.js';

describe('datePickerI18n', () => {
  test('exports en, zh, zhTW locales', () => {
    expect(datePickerI18n).toHaveProperty('en');
    expect(datePickerI18n).toHaveProperty('zh');
    expect(datePickerI18n).toHaveProperty('zhTW');
  });

  describe.each(['en', 'zh', 'zhTW'])('%s locale', (lang) => {
    test('has exactly 7 days', () => {
      expect(datePickerI18n[lang].days).toHaveLength(7);
    });

    test('has exactly 12 months', () => {
      expect(datePickerI18n[lang].months).toHaveLength(12);
    });

    test('has today and clear labels', () => {
      expect(typeof datePickerI18n[lang].today).toBe('string');
      expect(datePickerI18n[lang].today.length).toBeGreaterThan(0);
      expect(typeof datePickerI18n[lang].clear).toBe('string');
      expect(datePickerI18n[lang].clear.length).toBeGreaterThan(0);
    });

    test('has a dateFormat string', () => {
      expect(typeof datePickerI18n[lang].dateFormat).toBe('string');
      expect(datePickerI18n[lang].dateFormat.length).toBeGreaterThan(0);
    });

    test('firstDayOfWeek is a number', () => {
      expect(typeof datePickerI18n[lang].firstDayOfWeek).toBe('number');
    });
  });

  test('en uses Sunday as first day (0)', () => {
    expect(datePickerI18n.en.firstDayOfWeek).toBe(0);
  });

  test('zh and zhTW use Monday as first day (1)', () => {
    expect(datePickerI18n.zh.firstDayOfWeek).toBe(1);
    expect(datePickerI18n.zhTW.firstDayOfWeek).toBe(1);
  });

  test('en day names are in English', () => {
    expect(datePickerI18n.en.days).toContain('Sun');
    expect(datePickerI18n.en.days).toContain('Sat');
    expect(datePickerI18n.en.days[0]).toBe('Sun');
    expect(datePickerI18n.en.days[6]).toBe('Sat');
  });

  test('en month names start with January', () => {
    expect(datePickerI18n.en.months[0]).toBe('January');
    expect(datePickerI18n.en.months[11]).toBe('December');
  });

  test('en dateFormat is MM/dd/yyyy', () => {
    expect(datePickerI18n.en.dateFormat).toBe('MM/dd/yyyy');
  });

  test('zh dateFormat contains year/month markers', () => {
    expect(datePickerI18n.zh.dateFormat).toContain('年');
    expect(datePickerI18n.zh.dateFormat).toContain('月');
  });

  test('zh today is 今天', () => {
    expect(datePickerI18n.zh.today).toBe('今天');
  });

  test('zh clear is 清除', () => {
    expect(datePickerI18n.zh.clear).toBe('清除');
  });

  test('zhTW and zh have same day names', () => {
    expect(datePickerI18n.zhTW.days).toEqual(datePickerI18n.zh.days);
  });

  test('zhTW and zh have same month names', () => {
    expect(datePickerI18n.zhTW.months).toEqual(datePickerI18n.zh.months);
  });

  test('en today is Today', () => {
    expect(datePickerI18n.en.today).toBe('Today');
  });

  test('en clear is Clear', () => {
    expect(datePickerI18n.en.clear).toBe('Clear');
  });
});
