VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "Sheet1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True



Private Sub Worksheet_Change(ByVal Target As Range)

If Target.Address = "$G$2" Then
    Range("Table1[#All]").AutoFilter 6, Range("$M$1").Value
End If

End Sub


Private Sub Workbook_Open()

Application.UseSystemSeparators = False

Application.DecimalSeparator = "."

Application.ThousandsSeparator = ","

End Sub

Private Sub Workbook_BeforeClose(Cancel As Boolean)

Application.UseSystemSeparators = True

End Sub
