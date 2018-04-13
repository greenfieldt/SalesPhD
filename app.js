const fs = require('fs');
const util = require('util');
const assert = require('assert');
const streams = require('memory-streams');
const urlExists = util.promisify(require('url-exists'));
const socketIO = require('socket.io-client');

const filename = process.env.PATH_TO_SAMPLE_DATA
const encoding = 'MP3'; //Sample data is an MP3 file
const sampleRateHertz = 16000;
const languageCode = 'en-US';
const packet_size = 65536;

const server_ip = process.env.SERVER_IP
const server_port = 3000;

const audio = {
    
    readStream: fs.createReadStream(filename),
    writeStream: new streams.WritableStream(),
    socket: 0
};

const config = {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
};
    
const stream = {
    UUID: process.pid,  //hopefully this will unique enough for now
    file_size: fs.statSync(filename).size, //in bytes
    packet_size: packet_size,
    number_of_packets: -1,  
    packet_number: -1
}



async function checkSetup()
{
    //make sure our audio file exists
    assert(fs.statSync(filename).isFile() == true)


    //Why doesn't this work...
    //make sure the server is on
    let isExists = await urlExists(server_ip);
//    assert(isExists == true)

    
    return true;
}


//Set up our data structures
async function init()
{
    
    stream.number_of_packets = Math.floor(stream.file_size / packet_size);
    stream.packet_number  = 0;
    //Because I'm using local tunnel and I've told it to  use port 3000
    //I don't need to specify the port number to use here...
    //If you don't use local tunnel or have the server using a different port
    //change that here

    //My default code is streaming to / on port 3000
    audio.socket = socketIO(server_ip);

    //audio.socket.emit('audio',"test test test");
}


function createJSONWrapper(array_of_header_objects)
{
    let jsonWrapper = {}

 
    for(var a_object in array_of_header_objects)
    {
	jsonWrapper = Object.assign(jsonWrapper,array_of_header_objects[a_object]);
    }    
    return jsonWrapper;
}


//sometimes it is useful to stop after just a few frames for debugging
var i = 0;

audio.readStream.on('readable', function() {

    var chunk;
    while(null !== (chunk = audio.readStream.read()))
    {
	i++;
	if(i > 5)
	{
//	    break;
	}

	
	let b64Data =  chunk; 
	
	console.log("buffer size:", b64Data.length);

	
	let wrapper = createJSONWrapper([config,stream]);
	wrapper.content = b64Data;

	wrapper.packet_size = b64Data.length;

	console.log("my wrapper", wrapper);

	//update this before we stream because I'm not sure how long it will take
	//to actually stream the data and by the time it this call finshes we could
	//already be streaming the next packet
	stream.packet_number++;

	//console.log(wrapper.packet_number);
	
	audio.socket.emit('audio',wrapper);
    }
});




async function main()
{
    await checkSetup();
    await init();
    //audio.readStream.pipe(audio.writeStream);
    
}


main()
