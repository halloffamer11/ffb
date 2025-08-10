Attribute VB_Name = "Module28"
Sub cleartrades()
Attribute cleartrades.VB_ProcData.VB_Invoke_Func = " \n14"
'
' cleartrades Macro
'

'
    Sheets("Pick Trades").Select
    Range("Table2[New Owner]").Select
    Selection.ClearContents
    Sheets("Overall").Select
    Range("H8").Select
End Sub
