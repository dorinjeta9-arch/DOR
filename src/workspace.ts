/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export async function createCalendarEvent(
  token: string,
  summary: string,
  description: string,
  startDateTime: string,
  endDateTime: string
) {
  const confirmed = window.confirm(`¿Deseas programar el evento "${summary}" en tu Google Calendar?`);
  if (!confirmed) return null;

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary,
      description,
      start: { dateTime: startDateTime },
      end: { dateTime: endDateTime },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Error al crear evento en Google Calendar");
  }
  return await res.json();
}

export async function createGoogleTask(token: string, title: string, notes: string) {
  const confirmed = window.confirm(`¿Deseas añadir la tarea de producción "${title}" a Google Tasks?`);
  if (!confirmed) return null;

  const res = await fetch("https://www.googleapis.com/tasks/v1/lists/@default/tasks", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      notes,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Error al crear tarea en Google Tasks");
  }
  return await res.json();
}

export async function createGoogleSlideDeck(token: string, title: string) {
  const confirmed = window.confirm(`¿Deseas generar una presentación de Google Slides para "${title}"?`);
  if (!confirmed) return null;

  const res = await fetch("https://slides.googleapis.com/v1/presentations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `PROJET 3D - ${title}`,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Error al crear presentación en Google Slides");
  }
  return await res.json();
}

export async function createGoogleMeetSpace(token: string) {
  const confirmed = window.confirm("¿Deseas crear una sala de videoconferencia en Google Meet para la consulta técnica?");
  if (!confirmed) return null;

  const res = await fetch("https://meet.googleapis.com/v2/spaces", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Error al crear espacio en Google Meet");
  }
  return await res.json();
}
