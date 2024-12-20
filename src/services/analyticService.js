import supabase from "../config/supabaseClient.js";
import CustomError from "../utils/CustomError.js";
import { parseISO, getDay, startOfWeek, endOfWeek, format } from "date-fns";

const getEmotionCount = async (user_id) => {
  if (!user_id) {
    throw new CustomError("User ID is required", 400);
  }

  const now = new Date();
  const startOfSunday = startOfWeek(now, { weekStartsOn: 0 });
  const endOfSaturday = endOfWeek(now, { weekStartsOn: 0 });

  const startDate = format(startOfSunday, "yyyy-MM-dd'T'00:00:00'Z'");
  const endDate = format(endOfSaturday, "yyyy-MM-dd'T'23:59:59'Z'");

  const { data, error } = await supabase
    .from("journals")
    .select("*")
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .eq("user_id", user_id);

  if (error) {
    throw new CustomError(error.message, 500);
  }
  const transformedData = transformData(data);

  return transformedData;
};

const transformData = (data) => {
  const defaultEmotions = ["netral", "senang", "marah", "sedih"];

  const result = defaultEmotions.reduce((acc, emotion) => {
    acc[emotion] = Array(7).fill(0);
    return acc;
  }, {});

  data.forEach((journal) => {
    const { emotion, created_at } = journal;

    const date = parseISO(created_at);
    const dayIndex = getDay(date);

    const adjustedDayIndex = dayIndex === 0 ? 0 : dayIndex;

    if (result[emotion]) {
      result[emotion][adjustedDayIndex]++;
    }
  });

  // Transform result object into an array of objects
  return defaultEmotions.map((emotion) => ({
    emotion,
    values: result[emotion],
  }));
};

export { getEmotionCount, transformData };
