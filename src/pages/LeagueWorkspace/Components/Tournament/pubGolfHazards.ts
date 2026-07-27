export type PubGolfHazard = {
	name: string;
	description: string;
	defaultPenalty: number;
};

export const pubGolfHazards: PubGolfHazard[] = [
	{
		name: 'Water Hazard',
		description: 'No toilet breaks during this hole.',
		defaultPenalty: 2
	},
	{
		name: 'Bunker',
		description: 'Player must complete the hole from a seated position where practical.',
		defaultPenalty: 1
	},
	{
		name: 'Rough',
		description: 'Player must drink with their non-dominant hand.',
		defaultPenalty: 1
	},
	{
		name: 'Out of Bounds',
		description: 'Leaving the group or missing the venue rule adds strokes.',
		defaultPenalty: 2
	},
	{
		name: 'Time Hazard',
		description: 'Player must finish within the agreed time limit.',
		defaultPenalty: 1
	},
	{
		name: 'Blind Shot',
		description: 'Player chooses their drink order before seeing the full venue options.',
		defaultPenalty: 1
	},
	{
		name: 'Quiet Zone',
		description: 'No shouting, chanting or loud forfeits during this hole.',
		defaultPenalty: 1
	},
	{
		name: 'One Handed',
		description: 'Player can only use one hand for the whole hole.',
		defaultPenalty: 1
	},
	{
		name: 'Straw Only',
		description: 'Player must drink through a straw if one is available.',
		defaultPenalty: 1
	},
	{
		name: 'Lucky Draw',
		description: 'A random bonus rule is chosen before the hole starts.',
		defaultPenalty: 1
	}
];

export function getPubGolfHazard(name?: string | null) {
	if (!name) {
		return null;
	}

	return pubGolfHazards.find((hazard) => hazard.name === name) ?? null;
}
