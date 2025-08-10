Attribute VB_Name = "Module6"
Sub beersheetdrafted()
'
' beersheetdrafted Macro
'


Dim qbrange As Range
Dim rbrange As Range
Dim wrrange As Range

Dim qbcell As String
Dim rbcell As String
Dim wrcell As String


Dim qbcol1 As Integer
Dim rbcol1 As Integer
Dim wrcol1 As Integer

Dim qbcol2 As Integer
Dim rbcol2 As Integer
Dim wrcol2 As Integer

qbcol1 = Sheets("Beersheet Condensed").Range("Q5").Value
rbcol1 = Sheets("Beersheet Condensed").Range("Q6").Value
wrcol1 = Sheets("Beersheet Condensed").Range("Q7").Value

qbcol2 = Sheets("Beersheet Condensed").Range("ab5").Value
rbcol2 = Sheets("Beersheet Condensed").Range("ab6").Value
wrcol2 = Sheets("Beersheet Condensed").Range("ab7").Value

Set qbrange = Range(Cells(6, qbcol1), Cells(85, qbcol2))
Set rbrange = Range(Cells(6, rbcol1), Cells(85, rbcol2))
Set wrrange = Range(Cells(6, wrcol1), Cells(85, wrcol2))

qbcell = Cells(6, qbcol1).Address(False, True)
rbcell = Cells(6, rbcol1).Address(False, True)
wrcell = Cells(6, wrcol1).Address(False, True)

'QB columns
With qbrange


.FormatConditions.Add Type:=xlExpression, Formula1:="=IF(INDEX(Overall!$E$12:$E$650,MATCH(" & qbcell & ",Overall!$F$12:$F$650,0)) = ""Yes"", TRUE, FALSE)"
With .FormatConditions(.FormatConditions.Count)
.SetFirstPriority
    With .Font
        .Bold = False
        .Italic = True
        .Strikethrough = True
        .ThemeColor = xlThemeColorDark1
        .TintAndShade = -0.209986266670736
    End With
.StopIfTrue = False
    End With
           End With
'TE columns

 With qbrange


.FormatConditions.Add Type:=xlExpression, Formula1:="=IF(INDEX(Overall!$E$12:$E$650,MATCH(" & qbcell & ",Overall!$F$12:$F$650,0)) = ""Yes"", TRUE, FALSE)"
With .FormatConditions(.FormatConditions.Count)
.SetFirstPriority
    With .Font
        .Bold = False
        .Italic = True
        .Strikethrough = True
        .ThemeColor = xlThemeColorDark1
        .TintAndShade = -0.209986266670736
    End With
.StopIfTrue = False
    End With
          End With

    'RB columns
    

With rbrange

   .FormatConditions.Add Type:=xlExpression, Formula1:="=IF(INDEX(Overall!$E$12:$E$650,MATCH(" & rbcell & ",Overall!$F$12:$F$650,0)) = ""Yes"", TRUE, FALSE)"
    With .FormatConditions(.FormatConditions.Count)
    .SetFirstPriority
    With .Font
        .Bold = False
        .Italic = True
        .Strikethrough = True
        .ThemeColor = xlThemeColorDark1
        .TintAndShade = -0.209986266670736
    End With
    .StopIfTrue = False
    End With
    End With

    'WR columns

  With wrrange


   .FormatConditions.Add Type:=xlExpression, Formula1:="=IF(INDEX(Overall!$E$12:$E$650,MATCH(" & wrcell & ",Overall!$F$12:$F$650,0)) = ""Yes"", TRUE, FALSE)"
   With .FormatConditions(.FormatConditions.Count)
    .SetFirstPriority
    With .Font
        .Bold = False
      .Italic = True
       .Strikethrough = True
        .ThemeColor = xlThemeColorDark1
        .TintAndShade = -0.209986266670736
    End With
   .StopIfTrue = False
    End With
        End With
End Sub
