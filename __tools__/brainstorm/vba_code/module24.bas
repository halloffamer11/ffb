Attribute VB_Name = "Module24"
Sub BeerVal()
Attribute BeerVal.VB_ProcData.VB_Invoke_Func = " \n14"
'
' BeerVal Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[BS Val]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub BeerPS()
Attribute BeerPS.VB_ProcData.VB_Invoke_Func = " \n14"
'
' BeerPS Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[PosScarcity]]"), SortOn:=xlSortOnValues, Order _
        :=xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub

Sub BeerTier()
'
' BeerPS Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[BeerTier]]"), SortOn:=xlSortOnValues, Order _
        :=xlAscending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub BeerAdjVal()
Attribute BeerAdjVal.VB_ProcData.VB_Invoke_Func = " \n14"
'
' BeerAdjVal Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[AdjBSval]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub SortVBD()
'
' BeerAdjVal Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[VBD]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub SortVBDval()
'
' BeerAdjVal Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[VAL%]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub Sort5PPR()
Attribute Sort5PPR.VB_ProcData.VB_Invoke_Func = " \n14"
'
' Sort5PPR Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[2QB]]"), SortOn:=xlSortOnValues, Order:= _
        xlAscending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With
End Sub
Sub RnkSkew()
Attribute RnkSkew.VB_ProcData.VB_Invoke_Func = " \n14"
'
' RnkSkew Macro
'

'
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields. _
        Clear
    ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort.SortFields.Add _
        Key:=Range("Table1[[#All],[ECR Skew]]"), SortOn:=xlSortOnValues, Order:= _
        xlDescending, DataOption:=xlSortNormal
    With ActiveWorkbook.Worksheets("Overall").ListObjects("Table1").Sort
        .Header = xlYes
        .MatchCase = False
        .Orientation = xlTopToBottom
        .SortMethod = xlPinYin
        .Apply
    End With

End Sub
