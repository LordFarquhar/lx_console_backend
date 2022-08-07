import { EventEmitter } from "events";
import { InvalidDMXError } from "../../Errors/InvalidDMXError";
import { DefinedProfile, DmxAddressRange, FixtureChannel, FixtureChannelType, UniverseData } from "../../types";

export interface ChannelEmissions {
	addressUpdate: (address: number, type: FixtureChannelType, value: number) => void;
	nameUpdate: (name: string) => void;
}

export class Channel extends EventEmitter {
	private _untypedOn = this.on;
	private _untypedEmit = this.emit;
	public on = <K extends keyof ChannelEmissions>(event: K, listener: ChannelEmissions[K]): this =>
		this._untypedOn(event, listener);
	public emit = <K extends keyof ChannelEmissions>(event: K, ...args: Parameters<ChannelEmissions[K]>): boolean =>
		this._untypedEmit(event, ...args);

	id: number;
	name: string;
	profile: DefinedProfile;
	dmxAddressRange: DmxAddressRange;
	channelMap: FixtureChannel[]; // a list of the profiles channels with the channelMode applied
	output: UniverseData;

	constructor(id: number, profile: DefinedProfile, dmxAddressStart: number) {
		super();

		this.id = id;
		this.name = profile.name;
		this.profile = profile;
		this.dmxAddressRange = {
			initial: dmxAddressStart,
			final: dmxAddressStart + profile.channelModes[profile.options.channelMode].count - 1
		};
		this.channelMap = profile.channelModes[profile.options.channelMode].channels.map((chNo) => {
			const ch = this.profile.channels[chNo];
			ch.addressOffset = chNo;
			return ch;
		});
		this.output = new Array(this.channelMap.length).fill(-1);
	}

	_setId(id: number): Channel {
		this.id = id;
		return this;
	}

	setName(name: string): Channel {
		this.name = name;
		this.emit("nameUpdate", name);
		return this;
	}

	setAddress(index: number, value: number) {
		if (!this.channelMap[index])
			throw new InvalidDMXError(`Address Offset ${index} does not exist in channelMap in this mode`);
		this.output[index] = value;
		this.emit(`addressUpdate`, index, this.channelMap[index].type, value);
	}

    getChannelsMatchType(type: FixtureChannelType) {
		return this.channelMap.filter((ch) => ch.type == type);
	}

	// ! access the correct channel of type by keeping the same index
	// No need to "understand" what each channel does, simply remember the type and index offset

	getAddressFromType(type: FixtureChannelType) {
		return this.channelMap.findIndex((ch) => ch.type == type);
	}

	get masterAddress() {
		return this.channelMap.findIndex((ch) => ch.type == "INTENSITY");
	}
}
