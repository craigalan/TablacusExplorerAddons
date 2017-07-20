﻿var Addon_Id = "pathicon";

var item = GetAddonElement(Addon_Id);
Addons.PathIcon = {
	Icon: {},
	fStyle: LVIS_CUT | LVIS_SELECTED,

	GetIconImage: function (fn, Large)
	{
		var image;
		fn = api.PathUnquoteSpaces(ExtractMacro(te, fn));
		if (/\.ico$|\*/i.test(fn)) {
			var sfi = api.Memory("SHFILEINFO");
			if (Large) {
				api.SHGetFileInfo(fn, 0, sfi, sfi.Size, SHGFI_SYSICONINDEX | SHGFI_USEFILEATTRIBUTES);
				sfi.hIcon = api.ImageList_GetIcon(te.Data.SHIL[SHIL_EXTRALARGE], sfi.iIcon, ILD_NORMAL);
			} else {
				api.SHGetFileInfo(fn, 0, sfi, sfi.Size, SHGFI_ICON | SHGFI_SMALLICON | SHGFI_USEFILEATTRIBUTES);
			}
			image = te.WICBitmap().FromHICON(sfi.hIcon);
			api.DestroyIcon(sfi.hIcon);
		} else {
			image = te.WICBitmap().FromFile(fn);
		}
		return image;
	},

	Exec: function (Ctrl, pt)
	{
		AddonOptions("pathicon", function ()
		{
		}, { FV: GetFolderView(Ctrl, pt) });
	}
};

if (window.Addon == 1) {
	AddEvent("HandleIcon", function (Ctrl, pid)
	{
		if (Ctrl.hwndList && pid) {
			var i = Ctrl.IconSize < 32 ? 0 : 1, db = Addons.PathIcon.Icon[pid.Path.toLowerCase()];
			if (db) {
				var image = db[i];
				if (image) {
					if (/string/i.test(typeof image)) {
						var image = Addons.PathIcon.GetIconImage(image, i);
						if (image) {
							db[i] = GetThumbnail(image, [32, 256][i] * screen.logicalYDPI / 96, true);
							return true;
						}
					} else {
						return true;
					}
				}
			}
		}
	}, true);

	AddEvent("ItemPostPaint", function (Ctrl, pid, nmcd, vcd)
	{
		var hList = Ctrl.hwndList;
		if (hList && pid) {
			var db = Addons.PathIcon.Icon[pid.Path.toLowerCase()];
			if (db) {
				var image = db[Ctrl.IconSize < 32 ? 0 : 1];
				if (/object/i.test(typeof image)) {
					var cl, fStyle, rc = api.Memory("RECT");
					rc.Left = LVIR_ICON;
					api.SendMessage(hList, LVM_GETITEMRECT, nmcd.dwItemSpec, rc);
					var state = api.SendMessage(hList, LVM_GETITEMSTATE, nmcd.dwItemSpec, Addons.PathIcon.fStyle);
					if (state == LVIS_SELECTED) {
						cl = CLR_DEFAULT;
						fStyle = api.GetFocus() == hList ? ILD_SELECTED : ILD_FOCUS;
					} else {
						cl = CLR_NONE;
						fStyle = (state & LVIS_CUT) || api.GetAttributesOf(pid, SFGAO_HIDDEN) ? ILD_SELECTED : ILD_NORMAL;
					}
					image = GetThumbnail(image, Ctrl.IconSize * screen.logicalYDPI / 96, Ctrl.IconSize >= 32);
					image.DrawEx(nmcd.hdc, rc.Left + (rc.Right - rc.Left - image.GetWidth()) / 2, rc.Top + (rc.Bottom - rc.Top - image.GetHeight()) / 2, 0, 0, cl, cl, fStyle);
					return S_OK;
				}
			}
		}
	}, true);

	Addons.PathIcon.strName = item.getAttribute("MenuName") || GetText(GetAddonInfo(Addon_Id).Name);
	//Menu
	if (item.getAttribute("MenuExec")) {
		Addons.PathIcon.nPos = api.LowPart(item.getAttribute("MenuPos"));
		AddEvent(item.getAttribute("Menu"), function (Ctrl, hMenu, nPos)
		{
			api.InsertMenu(hMenu, Addons.PathIcon.nPos, MF_BYPOSITION | MF_STRING, ++nPos, Addons.PathIcon.strName);
			ExtraMenuCommand[nPos] = Addons.PathIcon.Exec;
			return nPos;
		});
	}
	//Key
	if (item.getAttribute("KeyExec")) {
		SetKeyExec(item.getAttribute("KeyOn"), item.getAttribute("Key"), Addons.PathIcon.Exec, "Func");
	}
	//Mouse
	if (item.getAttribute("MouseExec")) {
		SetGestureExec(item.getAttribute("MouseOn"), item.getAttribute("Mouse"), Addons.PathIcon.Exec, "Func");
	}
	//Type
	AddTypeEx("Add-ons", "Path icon", Addons.PathIcon.Exec);

	try {
		var ado = OpenAdodbFromTextFile(fso.BuildPath(te.Data.DataFolder, "config\\pathicon.tsv"));
		while (!ado.EOS) {
			var ar = ado.ReadText(adReadLine).split("\t");
			if (ar[0]) {
				var s = api.PathUnquoteSpaces(ExtractMacro(te, ar[0])).toLowerCase();
				if (s) {
					var db = {};
					Addons.PathIcon.Icon[s] = db;
					for (var j = 2; j--;) {
						if (ar[j + 1]) {
							db[j] = ar[j + 1];
						}
					}
				}
			}
		}
		ado.Close();
	} catch (e) {}

	if (api.IsAppThemed() && WINVER >= 0x600) {
		AddEvent("Load", function ()
		{
			if (!Addons.ClassicStyle) {
				Addons.PathIcon.fStyle = LVIS_CUT;
			}
		});
	}
} else {
	importScript("addons\\" + Addon_Id + "\\options.js");
}