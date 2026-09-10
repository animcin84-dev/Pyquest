
import { postAuthenticated } from './serverApi';

export interface MentorChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface MentorChatProfile {
  username?: string;
  level?: number;
}

export interface DailyChallenge {
  title: string;
  description: string;
  initialCode: string;
  testCases: { inputValues: string[]; expectedOutput: string; description: string }[];
  reward: { xp: number; coins: number };
}

const requestJson = async <T>(path: string, body: unknown): Promise<T> => {
  return postAuthenticated<T>(path, body);
};

export const getMentorHint = async (code: string, challenge: string, error?: string) => {
  try {
    const data = await requestJson<{ text: string }>("/mentor/hint", { code, challenge, error });
    return data.text;
  } catch (requestError) {
    console.error("Gemini Error:", requestError);
    return "Хмм, мои нейронные связи немного запутались. Попробуй еще раз через минуту!";
  }
};

export const getMentorChat = async (
  messages: MentorChatMessage[],
  profile?: MentorChatProfile,
) => {
  try {
    const data = await requestJson<{ text: string }>("/mentor/chat", {
      messages: messages.slice(-6),
      profile,
    });
    return data.text;
  } catch (requestError) {
    console.error("Gemini Error:", requestError);
    throw requestError;
  }
};

export const generateDailyChallenge = async (userLevel: number) => {
  try {
    return await requestJson<DailyChallenge>("/daily-challenge", { userLevel });
  } catch (requestError) {
    console.error("Gemini Error:", requestError);
    
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
