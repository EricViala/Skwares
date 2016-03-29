var get,put,suppr, getAll; //These functions will be defined once the db is open


//Open the database
var ωρ = window.indexedDB.open("SkwaresPosDB", 1);
console.log('Request',ωρ);

//In case we cannot open
ωρ.onerror = function(event) {
	console.log('Database opening erred with code '+ ωρ.errorCode);
};

/* If it's a new database, or if, ¤by increasing the version number¤, we
 * signaled that we want to alter it*/
ωρ.onupgradeneeded = function(event) { 
	console.log('upgrade needed',event);
	var db2up = event.target.result;
	console.log('upgrading',db2up);
	var objectStore = db2up.createObjectStore("skwarePos", { keyPath: "id" });
};//If the onupgradeneeded event exits successfully, the onsuccess handler of 
//the open database ωρ will then be triggered. 


//open was a success, upgrade was performed if needed, now we can play
var δβ={}; //gotta start small
ωρ.onsuccess = function(event) {
	δβ=ωρ.result;
	console.log('DB successfully opened : ',δβ,' firing ',event);
	console.log('Now willing to transact with',δβ);
	

	get = function(key){
		var transaction = δβ.transaction(["skwarePos"]);
		var store = transaction.objectStore("skwarePos");
		var readReq = store.get(key);
		readReq.onerror=function(e){console.log(readReq.error)}
		readReq.onsuccess=function(e){
			var o=readReq.result;
			var props = [];
			for(p in o){
				if(o.hasOwnProperty(p))props.push(p +':'+o[p]);
			}
			return '{' + props.join(',') + '}';
			//e.g. {'sk12', '23px', '-121px'}
		}
	}

	suppr = function(id){
		if( !id ){
			console.log('Deletion was required but no key was supplied');
		}else{
			var transaction = δβ.transaction(["skwarePos"], 'readwrite');
			var store = transaction.objectStore('skwarePos');
			var delReq = store['delete'](id);
			delReq.onsuccess = function(){
				console.log('The record whose key was',id,'was deleted');
			};
			delReq.onerror = function(){
				console.log('Something went south while attempting to delete',
						delReq);
			}
		}
	}

	put = function(id,top,left){
		if( !id || !top || !left){
			console.log('Attemmpt to store illegal data was thwarted.',
					id,top,left);
		}else{
			var point = {id:id, top:top, left:left};
			console.log('Recording',point);
			var transaction = δβ.transaction(["skwarePos"], 'readwrite');
			var store = transaction.objectStore('skwarePos');
			
			//first, see if we already have something with this key.
			var readReq = store.get(id);
			readReq.onerror=function(e){
				console.log(readReq.error);
				// nothing found, proceed with writing
				writeit();
			}
			readReq.onsuccess=function(e){
				//something's there already, delete it, then write
				var delReq = store['delete'](id);
				delReq.onsuccess = writeit;
				delReq.onerror = function(){
					log('Crap ! Failed to delete while writing',point,delReq);
				}
			}
			
			var writeit = function(){
				var writeReq = store.add( point );
				writeReq.onsuccess = function(event) {
					console.log( 'Addition of', point, 'succeded', event);
				}
				writeReq.onerror = function(event) {
					console.log( 'Addition of', point, 'erred', event);
				}
			}
		}
	} // end put
	
} // Done dealing with the success of the opening transaction.