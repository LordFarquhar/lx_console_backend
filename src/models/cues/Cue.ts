import { UniverseData } from "../../types";

export class Cue {
	id: number;
	name: string;
	channelData: UniverseData;

	constructor(id: number, name: string, channelData: UniverseData) {
		this.id = id;
		this.name = name;
		this.channelData = channelData;
	}
}
