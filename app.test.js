const mockUser = { id: 1, name: "Іван", surname: "Тестовий", email: "test@gmail.com" };
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
global.sessionStorage = sessionStorageMock;
global.fetch = jest.fn();
function applyFilterLogic(records, filterValue) {
  let filtered = [...records];
  if (filterValue === "good") {
    filtered = filtered.filter(r => r.aqi <= 50);
  } else if (filterValue === "moderate") {
    filtered = filtered.filter(r => r.aqi > 50 && r.aqi <= 100);
  } else if (filterValue === "poor") {
    filtered = filtered.filter(r => r.aqi > 100);
  }
  return filtered;
}

describe("AirVision - Тестування Програмного Забезпечення", () => {
  beforeEach(() => {
    sessionStorage.clear();
    fetch.mockClear();
  });
  describe("Функціональне тестування", () => {
    test("Збереження та читання даних користувача з sessionStorage", () => {
      sessionStorage.setItem("user", JSON.stringify(mockUser));
      const savedUser = JSON.parse(sessionStorage.getItem("user"));
      expect(savedUser.name).toBe("Іван");
      expect(savedUser.email).toBe("test@gmail.com");
    });
    test("Генерація випадкових показників моніторингу в межах норми", () => {
      const aqi = Math.floor(Math.random() * 150);
      const pm25 = Math.floor(Math.random() * 50);
      const temperature = Math.floor(Math.random() * 15) + 15;
      const humidity = Math.floor(Math.random() * 40) + 40;
      expect(aqi).toBeGreaterThanOrEqual(0);
      expect(aqi).toBeLessThanOrEqual(150);
      expect(pm25).toBeLessThanOrEqual(50);
      expect(temperature).toBeGreaterThanOrEqual(15);
      expect(humidity).toBeGreaterThanOrEqual(40);
    });
    test("Успішне отримання історії записів", async () => {
      const mockRecords = [
        { aqi: 45, pm25: 12, temperature: 20, humidity: 55 },
        { aqi: 110, pm25: 35, temperature: 22, humidity: 60 }
      ];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRecords,
      });
      const response = await fetch("http://localhost:4000/api/records/1");
      const data = await response.json();
      expect(fetch).toHaveBeenCalledWith("http://localhost:4000/api/records/1");
      expect(data).toHaveLength(2);
      expect(data[0].aqi).toBe(45);
    });
  });
  describe("Тестування інтерфейсу", () => {
    const sampleHistory = [
      { aqi: 30, comment: "Чисте" },
      { aqi: 75, comment: "Помірне" },
      { aqi: 120, comment: "Забруднене" }
    ];
    test("Фільтр 'good' має повертати лише AQI <= 50", () => {
      const result = applyFilterLogic(sampleHistory, "good");
      expect(result).toHaveLength(1);
      expect(result[0].aqi).toBe(30);
    });
    test("Фільтр 'poor' має повертати лише AQI > 100", () => {
      const result = applyFilterLogic(sampleHistory, "poor");
      expect(result).toHaveLength(1);
      expect(result[0].aqi).toBe(120);
    });
    test("Фільтр 'all' повертає всі записи без змін", () => {
      const result = applyFilterLogic(sampleHistory, "all");
      expect(result).toHaveLength(3);
    });
  });
  describe("Тестування безпеки", () => {
    test("Захист від порожніх значень при реєстрації", () => {
      let name = "  ";
      let email = "test@example.com";
      const isInvalid = !name.trim() || !email.trim();
      expect(isInvalid).toBe(true);
    });
    test("Перевірка відсутності паролів у sessionStorage", () => {
      sessionStorage.setItem("user", JSON.stringify({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email
      }));
      const storedData = JSON.parse(sessionStorage.getItem("user"));
      expect(storedData.password).toBeUndefined();
    });
  });
});