System.Gadget.onSettingsClosing = SettingsClosing;
				
function LoadSettings(){
	var fn = System.Gadget.Settings.readString("FirstName");
	txtFirstName.innerText = fn == "" ? "Andrii" : fn;
	var ln = System.Gadget.Settings.readString("LastName");
	txtLastName.innerText = ln == "" ? "Klymenko" : ln;
	var i = System.Gadget.Settings.readString("Interval");
	txtInterval.innerText = i == "" ? "3000" : i;
}

function SettingsClosing(event){
    // User hit OK on the settings page.	
    if (event.closeAction == event.Action.commit){
		//updateEmpId();
		//System.Gadget.Settings.writeString("UserId", userId);
		System.Gadget.Settings.writeString("LastName", txtLastName.value);
		System.Gadget.Settings.writeString("FirstName", txtFirstName.value);
		System.Gadget.Settings.writeString("Interval", txtInterval.value);
		event.cancel = false;
    }
}