var Addon_Id = "remember";

var items = te.Data.Addons.getElementsByTagName(Addon_Id);
if (items.length) {
	var item = items[0];
	if (!item.getAttribute("Save")) {
		item.setAttribute("Save", 1000);
	}
}
if (window.Addon == 1) {
	Addons.Remember =
	{
		db: {},

		RememberFolder: function (FV)
		{
			if (FV && FV.FolderItem) {
				if (api.ILisEqual(FV.FolderItem, FV.Data.Remember)) {
					var path = api.GetDisplayNameOf(FV, SHGDN_FORPARSINGEX | SHGDN_FORPARSING);
					Addons.Remember.db[path] = [new Date().getTime(), FV.CurrentViewMode, FV.IconSize, FV.Columns, FV.SortColumn, FV.FocusedItem];
				}
			}
		}
	};

	var xml = OpenXml("remember.xml", true, false);
	if (xml) {
		var ID = ["Time", "ViewMode", "IconSize", "Columns", "SortColumn", "Focused", "Path"];
		var items = xml.getElementsByTagName('Item');
		for (i = items.length; i-- > 0;) {
			var item = items[i];
			var ar = new Array(ID.length);
			for (j = ID.length; j--;) {
				ar[j] = item.getAttribute(ID[j]);
			}
			if (ar[1]) {
				Addons.Remember.db[ar.pop()] = ar;
			}
		}
		xml = null;
	}

	AddEvent("BeforeNavigate", function (Ctrl, fs, wFlags, Prev)
	{
		if (Ctrl.Type <= CTRL_EB) {
			if (Prev) {
				var path = api.GetDisplayNameOf(Prev, SHGDN_FORPARSINGEX | SHGDN_FORPARSING);
				Addons.Remember.db[path] = [new Date().getTime(), Ctrl.CurrentViewMode, Ctrl.IconSize, Ctrl.Columns, Ctrl.SortColumn, Ctrl.FocusedItem];
			}
			var path = api.GetDisplayNameOf(Ctrl, SHGDN_FORPARSINGEX | SHGDN_FORPARSING);

			var ar = Addons.Remember.db[path];
			if (ar) {
				fs.ViewMode = ar[1];
				fs.ImageSize = ar[2];
			}
			else if (Ctrl && Ctrl.Items) {
				fs.ViewMode = Ctrl.CurrentViewMode;
				fs.ImageSize = Ctrl.IconSize;
			}
		}
	});

	AddEvent("ListViewCreated", function (Ctrl)
	{
		Ctrl.Data.Remember = api.GetDisplayNameOf(Ctrl, SHGDN_FORPARSINGEX | SHGDN_FORPARSING);
		var ar = Addons.Remember.db[Ctrl.Data.Remember];
		if (ar) {
			Ctrl.CurrentViewMode(ar[1], ar[2]);
			Ctrl.Columns = ar[3];
			Ctrl.SortColumn = ar[4];

			if (ar[5]) {
				Ctrl.SelectItem(ar[5], SVSI_FOCUSED | SVSI_ENSUREVISIBLE);
			}
			ar[0] = new Date().getTime();
		}
	});

	AddEvent("ChangeView", Addons.Remember.RememberFolder);
	AddEvent("CloseView", Addons.Remember.RememberFolder);
	AddEvent("Command", Addons.Remember.RememberFolder);
	AddEvent("InvokeCommand", function (ContextMenu, fMask, hwnd, Verb, Parameters, Directory, nShow, dwHotKey, hIcon)
	{
		var Ctrl = te.Ctrl(CTRL_FV);
		if (Ctrl) {
			Addons.Remember.RememberFolder(Ctrl);
		}
	});

	AddEvent("SaveConfig", function ()
	{
		Addons.Remember.RememberFolder(te.Ctrl(CTRL_FV));

		var arFV = [];
		for (path in Addons.Remember.db) {
			if (path) {
				var ar = Addons.Remember.db[path];
				ar.push(path);
				arFV.push(ar);
			}
		}

		arFV.sort(
			function(a, b) {
				return b[0] - a[0];
			}
		);
		var items = te.Data.Addons.getElementsByTagName("remember");
		if (items.length) {
			arFV.splice(items[0].getAttribute("Save"), arFV.length);
		}
		var xml = CreateXml();
		var root = xml.createElement("TablacusExplorer");

		var ID = ["Time", "ViewMode", "IconSize", "Columns", "SortColumn", "Focused", "Path"];
		while (arFV.length) {
			var ar = arFV.shift()
			var item = xml.createElement("Item");
			for (j = ID.length; j-- > 0;) {
				item.setAttribute(ID[j], ar[j]);
			}
			root.appendChild(item);
		}
		xml.appendChild(root);
		SaveXmlEx("remember.xml", xml, true);
		xml = null;
	});
}
