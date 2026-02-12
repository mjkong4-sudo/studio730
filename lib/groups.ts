// Shared group definitions - used by API and pages for id <-> name mapping
export const AVAILABLE_GROUPS = [
  {
    id: "studio-730-cupertino",
    name: "Studio 7:30 (Cupertino)",
    location: "Cupertino",
    day: "Thursday",
    time: "7:30 PM",
    description: "Join us every Thursday at 7:30 PM in Cupertino"
  },
  {
    id: "studio-800-palo-alto",
    name: "Studio 8:00 (Palo Alto)",
    location: "Palo Alto",
    day: "Sunday",
    time: "8:00 AM",
    description: "Join us every Sunday at 8:00 AM in Palo Alto"
  }
] as const

export function getGroupById(id: string) {
  return AVAILABLE_GROUPS.find((g) => g.id === id) ?? null
}

export function getGroupByName(name: string) {
  return AVAILABLE_GROUPS.find((g) => g.name === name) ?? null
}
