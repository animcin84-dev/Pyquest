
const API_BASE = "/api";

export const getMentorHint = async (code: string, challenge: string, error?: string) => {
  try {
    const response = await fetch(`${API_BASE}/mentor/hint`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, challenge, error })
    });
    
    if (!response.ok) throw new Error("Backend proxy error");
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Хмм, мои нейронные связи немного запутались. Попробуй еще раз через минуту!";
  }
};

export const generateDailyChallenge = async (userLevel: number) => {
  try {
    const response = await fetch(`${API_BASE}/daily-challenge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userLevel })
    });

    if (!response.ok) throw new Error("Backend proxy error");
    return await response.json();
  } catch (error) {
    console.error("Gemini Error:", error);
    
    return {
      title: "Анализ данных (Резервная ИИ-задача)",
      description: "Напишите код, который запрашивает у пользователя строку чисел через запятую и выводит их среднее арифметическое (округленное до целого).",
      initialCode: "def calculate_average():\n    # Ваш код\n    pass\n\ncalculate_average()",
      testCases: [
        { inputValues: ["10,20,30,40"], expectedOutput: "25", description: "Четыре числа" },
        { inputValues: ["5,5,5"], expectedOutput: "5", description: "Одинаковые числа" }
      ],
      reward: { xp: 200, coins: 100 }
    };
  }
};
