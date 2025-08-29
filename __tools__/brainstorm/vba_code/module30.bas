Attribute VB_Name = "Module30"
Sub srtPCgold()
Attribute srtPCgold.VB_ProcData.VB_Invoke_Func = " \n14"
'
' srtPCgold Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[Gold Rank]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
