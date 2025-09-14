// GET all widgets for a user
export const getUserWidgets = async (userId: string) => {
  try {
    const response = await fetch(`/api/widgets/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch widgets: ${response.statusText}`);
    }

    const widgets = await response.json();
    return widgets;
  } catch (error) {
    console.error("Error fetching user widgets:", error);
    throw error;
  }
};

// CREATE a new widget
export const createWidget = async (widgetData: {
  user_id: string;
  type: string;
  position: { x: number; y: number; w: number; h: number };
  data?: any;
}) => {
  try {
    const response = await fetch("/api/widgets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(widgetData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create widget: ${response.statusText}`);
    }

    const newWidget = await response.json();
    return newWidget;
  } catch (error) {
    console.error("Error creating widget:", error);
    throw error;
  }
};

// UPDATE a widget's position and data
export const updateWidget = async (
  widgetId: string,
  updateData: {
    position?: { x: number; y: number; w: number; h: number };
    data?: any;
  }
) => {
  try {
    const response = await fetch(`/api/widgets/${widgetId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update widget: ${response.statusText}`);
    }

    const updatedWidget = await response.json();
    return updatedWidget;
  } catch (error) {
    console.error("Error updating widget:", error);
    throw error;
  }
};

// DELETE a widget
export const deleteWidget = async (widgetId: string) => {
  try {
    const response = await fetch(`/api/widgets/${widgetId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete widget: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting widget:", error);
    throw error;
  }
};

// BULK save/update all widgets for a user (useful for layout changes)
export const saveUserWidgetLayout = async (
  userId: string,
  layout: Array<{ i: string; x: number; y: number; w: number; h: number }>,
  widgetStates: Record<string, { visible: boolean; minimized: boolean }>
) => {
  try {
    const response = await fetch(`/api/widgets/${userId}/layout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ layout, widgetStates }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save widget layout: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error saving widget layout:", error);
    throw error;
  }
};

// DELETE all widgets for a user
export const deleteAllUserWidgets = async (userId: string) => {
  try {
    const response = await fetch(`/api/widgets/${userId}/all`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete all widgets: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting all widgets:", error);
    throw error;
  }
};
