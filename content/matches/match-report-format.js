/**
 * Formats the match report.
 * @author spambot
 */

Foxtrick.util.module.register({
	MODULE_NAME : "MatchReportFormat",
	MODULE_CATEGORY : Foxtrick.moduleCategories.MATCHES,
	PAGES : new Array('match'),
	OPTIONS:['SeparateOwnTeamColors'],

	CSS : Foxtrick.InternalPath + "resources/css/match-report.css",

	run : function(doc) {
		if (Foxtrick.Pages.Match.isPrematch(doc))
			return;

		var isyouth = (doc.location.search.search(/isYouth=true/i) > -1);

		var div = doc.getElementById('mainBody');
		var processed = (doc.getElementsByClassName("ft_mR_format").length > 0);
		if (processed) return;

		// used for clicking on match events in the sidebar and jump to event in the report.
		Foxtrick.util.inject.jsLink(doc, Foxtrick.InternalPath+"resources/js/MatchReport.js");

		// Retrieve team IDs
		var myTeamId = isyouth ? Foxtrick.util.id.getOwnYouthTeamId() : Foxtrick.util.id.getOwnTeamId();
		if (!FoxtrickPrefs.isModuleOptionEnabled("MatchReportFormat", 'SeparateOwnTeamColors')) myTeamId=null;
		var sidebarBoxes = doc.getElementById('sidebar').getElementsByClassName('sidebarBox'), sidebarBox;
		if (sidebarBoxes[0].id == 'ft-links-box') sidebarBox = sidebarBoxes[1]; 
		else sidebarBox = sidebarBoxes[0];
		var teams =  sidebarBox.getElementsByTagName('table')[0];
		var homeTeamId = Foxtrick.util.id.findTeamId(teams.rows[0]);
		var AwayTeamId = Foxtrick.util.id.findTeamId(teams.rows[1]);

		// class names used for styling the report
		var HOME_TEAM_CLASS_NAME = (homeTeamId == myTeamId) ? "ft-match-report-team-mine" : "ft-match-report-team-home";
		var AWAY_TEAM_CLASS_NAME = (AwayTeamId == myTeamId) ? "ft-match-report-team-mine" : "ft-match-report-team-away";
		var HOME_GOAL_CLASS_NAME = (homeTeamId == myTeamId) ? "ft-match-report-goal-mine" : "ft-match-report-goal-home";
		var AWAY_GOAL_CLASS_NAME = (AwayTeamId == myTeamId) ? "ft-match-report-goal-mine" : "ft-match-report-goal-away";
		var NORMAL_EVENT_CLASS_NAME = "ft-match-report-event-normal";
		var SPECIAL_EVENT_CLASS_NAME = "ft-match-report-event-special";

		// links to lineup at ratings table
		var table =  doc.getElementById('mainBody').getElementsByTagName('table')[0];
		if (table) { // match finished
			var homeLineupLink = table.rows[0].cells[1].getElementsByTagName("a")[0];
			var awayLineupLink = table.rows[0].cells[2].getElementsByTagName("a")[0];
			Foxtrick.addClass(homeLineupLink, HOME_TEAM_CLASS_NAME);
			Foxtrick.addClass(awayLineupLink, AWAY_TEAM_CLASS_NAME);
		}
		// lets keep in mind, there could be another problem with supporters
		// var div_inner = div.getElementsByTagName("*")[Foxtrick.util.layout.isSupporter(doc) ? 3 : 2];
		var div_inner = div.getElementsByTagName("*")[Foxtrick.util.layout.isSupporter(doc) ? 4 : 2];
		var start = div_inner.innerHTML.indexOf('<br><br>');
		var end = div_inner.innerHTML.indexOf('<div class="separator">');

		var part = new Array('','','');
		part[0] = div_inner.innerHTML.substr(0, start);

		part[1] = div_inner.innerHTML.substr(start, end-start);
		var dummy = part[1].split('<br><br>');

		part[0] += '' + dummy[0] + '<br><br>' + dummy[1] + '<br>';
		part[1] = '';
		for (var i = 2; i< dummy.length; i++) {
			part[1] += dummy[i] + '<br><br>';
		}

		part[2] = div_inner.innerHTML.substr(end);
		part[1] = this.nl2br(part[1]);

		var search = new Array(
			/-(\d{1,3})/g,
			/(\s)(\d{1,3})/g,
			/(\s{5,})/g,
			/\<br \/\>br\<br \/\>br/g
			);
		var replace = new Array(
			"-<span class='ft_mR_format' style='font-weight:bold;'>$1</span>",
			"$1<span class='ft_mR_format' style='font-weight:bold;'>$2</span>",
			"br",
			"<br>\n"
			);

		// formation
		part[0] = part[0].replace(/ (\d{1,2})-(\d{1,2})-(\d{1,2})([., \-])/g," <span class='ft_mR_format' style='font-weight:bold;'>$1</span>-<span class='ft_mR_format' style='font-weight:bold;'>$2</span>-<span class='ft_mR_format' style='font-weight:bold;'>$3</span>$4");

		// goal
		part[1] = part[1].replace(/(\d{1,2})\! Gäste (\d{1,2})/g, "$1 - $2"); // german LA's work...
		part[1] = part[1].replace(/(\d{1,2}) a (\d{1,2})/g, "$1 - $2"); // Italiano LA's work...
		part[1] = part[1].replace(/(\d{1,2}):(\d{1,2})/g, "$1 - $2"); // Čeština LA's work...
		part[1] = part[1].replace(/(\d{1,2}) према (\d{1,2})/g, "$1 - $2"); // Srpski LA's work...
		part[1] = part[1].replace(/(\d{1,2}) tsjin (\d{1,2})/g, "$1 - $2"); // frysk LA's work...

		for (var i = 0; i < search.length; i++) {
			part[1] = part[1].replace(search[i], replace[i]);
		}

		dummy = part[0].split(/\n|<br>/);
		var match_start = dummy.length;
		var dummy2 = part[1].split(/<br>/);
		for (var i=0; i<dummy2.length;i++) {dummy.push(dummy2[i].replace(/<br \/>/g,''));}

		part[1]= '';
		var stage = 0;
		var fulltext = 0;
		var marg = '';
		var padd = '';
		var player = false;
		var part_num = 0;
		for (var i=0; i<dummy.length-2;i++) {
			marg = 'margin-top:10px;'
			padd = 'padding:2px;';
			var textClass = SPECIAL_EVENT_CLASS_NAME;
			if (part_num<4 && dummy[i].search(/Player.aspx/g)!=-1) {
							textClass = NORMAL_EVENT_CLASS_NAME;
			}
			dummy[i] = Foxtrick.trim(dummy[i]);
			//Foxtrick.log(i+' '+dummy[i].length+' '+dummy[i].substr(0,160)+' '+dummy[i+1].length+' '+ dummy[i+2].length);
			var next_part=false;
			if (dummy[i+1].length==0 && dummy[i+2].length==0) {
				//Foxtrick.log('-------next part--------');
				next_part=true;
				part_num++;
			}
			if (dummy[i] != '') {
				// get short team names from header
				if (dummy[i].split(' - ').length == 2 && stage == 0) { //header
					var names = dummy[i].split(' - ');
					//Foxtrick.log('TEAMS raw:', dummy[i], names);
					// removed goals
					var team1 = names[0].split('  ')[0];
					var team2 = names[1].split('  ')[1];
					if (!team2) team2 = names[1]; // ongoing match without goals in the header
					stage = 1;
					Foxtrick.log('TEAMS [' + team1 + '|' + team2 + ']');
				}
				if (stage==1 && dummy[i].indexOf('<span>(')!=-1) {
					dummy[i] = dummy[i].replace(/\<span\>\(/,'<span> (');
				}
				if (dummy[i].indexOf('/Arena/') != -1) {stage +=1;next_part=true;}

				if (stage>1) { //full report
					if (dummy[i].indexOf(team1) > -1 && !(dummy[i].indexOf('/Arena/') > -1)) {
						fulltext++;
						dummy[i] = dummy[i].replace(team1 + ' ', '<span class="' + HOME_TEAM_CLASS_NAME + '">' + team1 + '</span> ');
						dummy[i] = dummy[i].replace(' ' + team1, ' <span class="' + HOME_TEAM_CLASS_NAME + '">' + team1 + '</span>');
					}
					if (dummy[i].indexOf(team2) > -1 && !(dummy[i].indexOf('/Arena/') > -1)) {
						fulltext++;
						dummy[i] = dummy[i].replace(team2 + ' ', '<span class="' + AWAY_TEAM_CLASS_NAME + '">' + team2 + '</span> ');
						dummy[i] = dummy[i].replace(' ' + team2, ' <span class="' + AWAY_TEAM_CLASS_NAME + '">' + team2 + '</span>');
					}
					part[1] += '<div id="ft_mR_div_' + i + '" class="' + textClass + '" style="'+ marg + padd +'">' + dummy[i] + '</div>\n\n';
				}
				else {
					part[1] += dummy[i] + '\n\n';
				}

			}
			if (next_part) part[1] += '<div class="ft-match-report-separator"></div>'

		}
		div_inner.innerHTML = part[1] + part[2];

		var standing = new Array(0,0);
		var reg = /[ \(](\d{1,2})\-(\d{1,2})(.*?)/i;
		var divs = div.getElementsByTagName('div');

		if (!isyouth) var scoreboard = doc.getElementById('sidebar').getElementsByTagName('table')[2];
		else var scoreboard = doc.getElementById('sidebar').getElementsByTagName('table')[1];
		scoreboard.parentNode.id = 'scoreboard';
		var myTable = new Array();

		var tblbody = scoreboard.tBodies[0];
		for (var ti=0; ti<tblbody.rows.length; ti++) {
			if (tblbody.rows[ti].cells[2]) {
				var tbldummy = new Array(
					Foxtrick.trim(tblbody.rows[ti].cells[0].innerHTML),
					tblbody.rows[ti].cells[1].innerHTML,
					tblbody.rows[ti].cells[2].innerHTML
				);
				myTable.push(tbldummy);
			}
		}

		myTable = myTable.sort(this._mySort);

		try {
			while (tblbody.rows.length > 0) {
				tblbody.deleteRow(0);
			}
			var last_min = 200;
			for (var ti = myTable.length - 1; ti >= 0; ti--) {
				var minute = parseInt(myTable[ti][2]);
				var line = ((last_min > 45 && minute <= 45) || (last_min > 90 && minute <= 90) || (last_min > 105 && minute <= 105));
				if (line) {
					if (tblbody.rows.length > 0){
						var TR = tblbody.insertRow(0);
						var TD1 = doc.createElement("td");
						TD1.setAttribute('colspan', 3);
						TD1.className = "center";
						var separator = doc.createElement("div");
						separator.style.height = "3px";
						separator.style.backgroundImage = "url(\"Img.axd?res=Matches&img=separator.gif\")";
						separator.style.backgroundRepeat = "repeat-x";
						TD1.appendChild(separator);
						TR.appendChild(TD1);
					}
					last_min = minute;
				}
				var TR = tblbody.insertRow(0);
				var TD1 = doc.createElement("td");
				if (myTable[ti][0].search('gif') > -1) {
					var dummy_txt = doc.createElement("div")
					TD1.innerHTML= '<span style="cursor:pointer; white-space:nowrap;" onclick=gotoEvent(' + minute + ')>' + myTable[ti][0] + '</span>';
				}
				else {
					TD1.innerHTML= myTable[ti][0];
				}
				TD1.className = 'center';

				var TD2 = doc.createElement("td");
				TD2.innerHTML = myTable[ti][1];
				var TD3 = doc.createElement("td");
				TD3.innerHTML = myTable[ti][2];

				TR.appendChild(TD1);
				TR.appendChild(TD2);
				TR.appendChild(TD3);

				var TR = tblbody.insertRow(0);

				var TD1 = doc.createElement("td");
				TD1.style.padding = "1px";

				TR.appendChild(TD1);
			}
		}
		catch (e) {
			Foxtrick.log(e);
		}

		Foxtrick.log('BEGIN GOALS');
		var divs = doc.getElementsByTagName('h1')[0].parentNode.getElementsByTagName('div');
		for (var i = 7; i < divs.length; i++) {

			var text = divs[i].textContent;
			var toreplace = /\ \-\ /g;
			text = text.replace(/(\d{1,2}) - (\d{1,2})/g, "$1-$2");
			var score = reg.exec(text);

			var start_g = (divs[i].innerHTML.search(team1) > -1) ? 6 : 7;
			if (score && i > start_g) {
				Foxtrick.log('- detected @' + divs[i].id + ' [' + score + '] old: [' + standing + ']');
				if (score[1] > standing[0]) {
					standing[0]++;
					divs[i].className = HOME_GOAL_CLASS_NAME;

					var scorerep = standing[0] + '-' + standing[1];
					scoreboard.innerHTML = scoreboard.innerHTML.replace(scorerep,
						'<a onclick="goToElementById(\'' + divs[i].id + '\');" class="ft-match-report-scoreboard"><b>'+standing[0]+'</b> - '+standing[1]+'</a>');
					Foxtrick.log('  GOAL for TEAM 1');
				}
				else if (score[2] > standing[1]) {
					standing[1]++;
					divs[i].className = AWAY_GOAL_CLASS_NAME;

					var scorerep = standing[0] + '-' + standing[1];
					scoreboard.innerHTML = scoreboard.innerHTML.replace(scorerep,
						'<a onclick="goToElementById(\'' + divs[i].id + '\');" class="ft-match-report-scoreboard">'+standing[0]+' - <b>'+standing[1]+'</b></a>');
					Foxtrick.log('  GOAL for TEAM 2');
				}
				else Foxtrick.log('  NO GOALS');
			}
		}
		Foxtrick.log('END OF GOALs');

		// team names in header
		var header = doc.getElementsByTagName('h1')[0];
		header.innerHTML = header.innerHTML.replace(new RegExp("(\\s)"+team1+"(\\s)"), '$1<a class="' + HOME_TEAM_CLASS_NAME + '">' + team1 + '</a>$2');
		header.innerHTML = header.innerHTML.replace(new RegExp("(\\s)"+team2+"(\\s)"), '$1<a class="' + AWAY_TEAM_CLASS_NAME + '">' + team2 + '</a>$2')

		// team links at sidebar
		var sidebar = doc.getElementById('sidebar');
		var links = sidebar.getElementsByTagName('a');
		for (var i=0; i < links.length; i++) {
			if (links[i].getElementsByTagName('img').length > 0) continue;
			if (links[i].href.search('TeamID=' + homeTeamId) > 0) {
				Foxtrick.addClass(links[i], HOME_TEAM_CLASS_NAME);
			}
			else if (links[i].href.search('TeamID=' + AwayTeamId) > 0) {
				Foxtrick.addClass(links[i], AWAY_TEAM_CLASS_NAME);
			}
		}
	},

	nl2br : function(text) {
		text = escape(text);
		var re_nlchar='';
		if (text.indexOf('%0D%0A') > -1){
			re_nlchar = /%0D%0A/g ;
		}
		else if (text.indexOf('%0A') > -1){
			re_nlchar = /%0A/g ;
		}
		else if (text.indexOf('%0D') > -1){
			re_nlchar = /%0D/g ;
		}
		return unescape(text.replace(re_nlchar,'<br />'));
	},

	_mySort : function(a, b) {
		var tmp1 = parseInt( a[2] );
		var tmp2 = parseInt( b[2] );
		return tmp1 > tmp2 ? 1 :
			tmp1 < tmp2 ? -1 :
			a[2] > b[2] ? 1 :
			a[2] < b[2] ? -1 :
			0;
	}
});
