/**
 *
 * 
 * xml_load.js
 * xml loading
 * @author convinced
 */
  
if (!Foxtrick) var Foxtrick={};


Foxtrick.XMLData = {

    MODULE_NAME : "XMLData",
	DEFAULT_ENABLED : true,
	PAGES : new Array('all'), 

	League : {},
	countryid_to_leagueid : {},
	htLanguagesXml : null,
	htCurrencyXml : null,
	htNTidsXml: null,
	htversionsXML: null,
	htdateformat: null,
	aboutXML:null,
	
	
	playersxml:null,	
	matchxmls: new Array(),
	
	init : function() {
	try{
		this.htLanguagesXml = Foxtrick.loadXmlIntoDOM("chrome://foxtrick/content/htlocales/htlang.xml");
		this.htCurrencyXml = Foxtrick.LoadXML("chrome://foxtrick/content/htlocales/htcurrency.xml");
		this.htNTidsXml = Foxtrick.LoadXML("chrome://foxtrick/content/htlocales/htNTidList.xml");
		this.htversionsXML = Foxtrick.LoadXML("chrome://foxtrick/content/htlocales/htversions.xml");
		this.htdateformat = Foxtrick.LoadXML("chrome://foxtrick/content/htlocales/htdateformat.xml");
		this.aboutXML = Foxtrick.LoadXML("chrome://foxtrick/content/htlocales/foxtrick_about.xml");	
		
		var worlddetailsXML = Foxtrick.LoadXML("chrome://foxtrick/content/htlocales/worlddetails.xml");	
			
		var data ={};
		var name = 'HattrickData';
		Foxtrick.XMLData.getchilds(worlddetailsXML.documentElement,data,name);
		
		for (var i in data.HattrickData.LeagueList.League) {
			this.League[data.HattrickData.LeagueList.League[i].LeagueID] = data.HattrickData.LeagueList.League[i];
			this.countryid_to_leagueid[data.HattrickData.LeagueList.League[i].Country.CountryID] = data.HattrickData.LeagueList.League[i].LeagueID;
		}
			
		for (var i in this.League){
				//dump(this.League[i].LeagueID+' ' +i+''+Foxtrick.XMLData.League[i].LeagueName+'\n');
		}

		for (var i in this.countryid_to_leagueid){
				//dump(this.countryid_to_leagueid[i]+' ' +i+'\n');
		}
		
	} catch(e){Foxtrick.dump('Foxtrick.XMLData.init: '+e+'\n');}
	},
	
	
	getchilds : function(el,parent,tag) {
		var childs = el.childNodes;
		var only_text=true;
		var text=null;
		var isarray=false;
		if (parent[tag]) {
			// if a tag is not unique, make an array and add nodes to that
			isarray=true; 
			if (!parent[tag][0]) {
				var old_val = parent[tag];
				parent[tag] = new Array();
				parent[tag].push(old_val);
			}
			parent[tag].push({});
		}
		else {parent[tag] = {};} // assume unique tag and make a assosiative node
		
		for (var i=0;i<childs.length;++i) {
			if (childs[i].nodeType==childs[i].ELEMENT_NODE ) {
				only_text=false;
				if (isarray) Foxtrick.XMLData.getchilds(childs[i], parent[tag][parent[tag].length-1], childs[i].nodeName);
				else Foxtrick.XMLData.getchilds(childs[i], parent[tag], childs[i].nodeName);				
			}
			else if (childs[i].nodeType==childs[i].TEXT_NODE ) {
				text = childs[i].textContent;
			}
		}
		if (only_text) { 
			if (isarray) parent[tag][parent[tag].length-1] = text;
			else parent[tag] = text;
		}
	},

	run : function(page,doc) {
	
		try {
			if (FoxtrickStaffMarker.hty_staff==null){
				FoxtrickStaffMarker.hty_staff = new Array();
				var req = new XMLHttpRequest();
				req.open('GET', 'http://www.hattrick-youthclub.org/_admin/foxtrick/team.xml', false); 
				req.send(null);
				if (req.status == 200) {
					//Foxtrick.dump(req.responseText+'\n');
					var frag = doc.createElement('dummy');
					frag.innerHTML = req.responseText;
					var htyusers = frag.getElementsByTagName('user');
					for (var i=0;i<htyusers.length;++i) {
						FoxtrickStaffMarker.hty_staff.push(htyusers[i].getElementsByTagName('alias')[0].innerHTML);
						//Foxtrick.dump(FoxtrickStaffMarker.hty_staff[i]+' ')
					}
					Foxtrick.dump('hty_staff loaded\n')
				}
				else {Foxtrick.dump('no connection to hty\n'); }				
			}
		}catch(e) {Foxtrick.dump('hty.xml: '+e+'\n'); }

		// XML get players xml
		
		if (doc.location.href.search(/\/Club\/Players\/\?TeamID=/i)!=-1 
			|| doc.location.href.search(/\/Club\/Players\//i)!=-1 )
			//|| doc.location.href.search(/\/Club\/NationalTeam\/NTPlayers.aspx/i)!=-1) 
			{
			// get players.xml
			var Oldies = doc.location.href.search(/\/Club\/Players\/Oldies.aspx/i)!=-1;
			var Coaches = doc.location.href.search(/\/Club\/Players\/Coaches.aspx/i)!=-1;
			
			var selection = '';  //default current players
			if (Oldies) selection='&actionType=viewOldies';
			if (Coaches) selection='&actionType=viewOldCoaches';
									
			//var teamid = FoxtrickHelper.findTeamId(doc.getElementById('ctl00_pnlSubMenu') ); 
			var teamid = doc.location.href.match(/teamid=(\d+)/i)[1];
			
			var team='';
			if (teamid) team = '&teamId='+teamid;
			this.playersxml = null;
			try {	var req = new XMLHttpRequest();
				req.open('GET', 'http://'+doc.location.hostname+'/Community/CHPP/Players/chppxml.axd?file=players'+team+selection, false); 
				req.send(null);
				if (req.status == 200) {
					this.playersxml = req.responseXML;
					Foxtrick.dump('get players.xml'+team+selection+'\n');
				}
				else Foxtrick.dump(' players.xml'+team+selection+' request failed\n');
			} catch(e) {Foxtrick.dump(' players.xml'+team+selection+' request failed'+e+'\n');}
		}

	/*try{
		var matchid = FoxtrickHelper.getMatchIdFromUrl(doc.location.href); 
		var isarchivedmatch = (doc.getElementById("ctl00_CPMain_lblMatchInfo")==null);
		var isprematch = (doc.getElementById("ctl00_CPMain_pnlPreMatch")!=null);
		if (isprematch) return;
		
		if (isarchivedmatch && typeof(this.matchxmls[matchid]) == 'undefined') {
			var req = new XMLHttpRequest();
			req.open('GET', 'http://'+doc.location.hostname+'/Community/CHPP/Matches/chppxml.axd?file=matchdetails&matchID='+matchid+'&matchEvents=true', false); 
			req.send(null);
			if (req.status == 200) {
				this.matchxmls[matchid] = req.responseXML;
				dump('matches.js: get new xml\n');
			}
			else Foxtrick.dump('matches.js: xml request failed\n');
		}
	} catch(e){Foxtrick.dump('matches.js run: '+e+'\n');}*/

	},

	change : function(page,doc) {
	},
}
